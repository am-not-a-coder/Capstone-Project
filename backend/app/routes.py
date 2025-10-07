import json
from flask import jsonify, request, session, send_from_directory, current_app, Response, render_template
from app import db, redis_client, socketio, mail
from werkzeug.security import check_password_hash, generate_password_hash, _hash_internal
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, decode_token, exceptions, verify_jwt_in_request                                
from flask_jwt_extended import set_access_cookies, set_refresh_cookies, unset_jwt_cookies
from flask_jwt_extended.exceptions import JWTExtendedException
from datetime import timedelta, datetime, timezone
from app.utils.normalize_path import normalize_path
from app.utils.file_extractor import extract_pdf, extract_docs, extract_excel, extract_image
from app.utils.tagging_utils import rule_based_tag, extract_global_tfid_tags
from app.nextcloud_service import upload_to_nextcloud, preview_from_nextcloud, delete_from_nextcloud, ensure_directories, safe_path, list_files_from_nextcloud, preview_file_nextcloud, download_file_nextcloud, rename_file_nextcloud, edit_file_nextcloud
from sentence_transformers import SentenceTransformer
import numpy as np
import pandas as pd
import joblib
import mimetypes
import os
import re
import time
import redis
from app.otp_utils import generate_random
from flask_mail import Message as MailMessage
from app.login_handlers import complete_user_login
from app.models import Employee, Program, Area, Subarea, Institute, Document, Deadline, AuditLog, Announcement, Criteria, Conversation, ConversationParticipant, Message, MessageDeletion, Template, AreaBlueprint, SubareaBlueprint, CriteriaBlueprint, AppliedTemplate, Notification
from sqlalchemy import cast, String, func, text


def register_routes(app):
    # ============================================ AUTHENTICATION(LOGIN/LOGOUT) PAGE ROUTES ============================================
    
    # JWT Exception Handler
    @app.errorhandler(JWTExtendedException)
    def handle_jwt_exception(e):
        return jsonify({"error": str(e)}), 401 
    
    #LOGIN API
    @app.route('/api/login', methods=["POST"])
    def login():
        try:
            #Get the JSON from the request
            data = request.get_json()
            empID = data.get("employeeID")
            password = data.get("password")

            #Fetches the user from the db using the employeeID
            user = Employee.query.filter_by(employeeID=empID).first()
            #If the user is not found in the db
            if user is None:
                return jsonify({'success': False, 'message': 'Employee not found'})
            
            # Check if the user has a valid password hash
            if not user.password or len(user.password.strip()) == 0:
                return jsonify({'success': False, 'message': 'User account has no password set. Contact administrator.'}), 400
            
            # Try to verify the password hash, handle invalid hash format errors
            try:
                is_valid_password = check_password_hash(user.password, password)
            except ValueError as hash_error:
                current_app.logger.error(f"Invalid password hash for user {empID}: {hash_error}")
                return jsonify({'success': False, 'message': 'User account has invalid password format. Contact administrator.'}), 400
                
            if is_valid_password: 
                # audit successful login
                new_log = AuditLog(
                    employeeID = user.employeeID,
                    action = f"{user.lName}, {user.fName} {user.suffix}. LOGGED IN. Admin={user.isAdmin}"
                )
                db.session.add(new_log)
                db.session.commit()

                bypass = redis_client.get(f'otp_bypass:{empID}')
                if bypass:
                    return complete_user_login(user, empID)
                else:
                    otp_code = generate_random()
                    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=2)
                    user.otpcode = otp_code
                    user.otpexpiry = otp_expiry
                    db.session.commit()

                    html_body = render_template(
                        'email/otp.html',
                        otp=str(otp_code),
                        user_name=user.fName,
                        app_name='UDMS',
                        recipients=user.email,
                        logo_url='https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fudmwebsite.udm.edu.ph%2Fwp-content%2Fuploads%2F2023%2F11%2Fudm-logo-1.png&f=1&nofb=1&ipt=a0799b507adde1d83ee8939c52524c6fb2053df034c369f55787f6b1d5db7574'
                    )
                    msg = MailMessage('Your UDMS Login OTP Code', recipients=[user.email])
                    msg.html = html_body

                    redis_client.hset('pending_otps', empID, 'waiting')
                    mail.send(msg)

                    return jsonify({'success': True, 'message': 'OTP email sent succesfully'})
            else:
                return jsonify({'success': False, 'message': 'Invalid password'}), 401
        except Exception as e:
            current_app.logger.error(f"Login error: {e}")
            return jsonify({'success': False, 'message': 'Internal server error'}), 500
    
    @app.route('/api/verify-otp', methods=['POST'])
    def verify_otp():
        data = request.get_json()
        otp = data.get('otp')
        employeeID = data.get('employeeID')

        if not employeeID:
            return jsonify({'success': False, 'message': 'Employee ID are required.'}), 400
        if not otp:
            return jsonify({'success': False, 'message': 'OTP are required'}), 400
        if not otp.isdigit() or not len(otp) == 6:
            return jsonify({'success': False, 'message': 'OTP "ONLY" contains number and MUST be 6 digits.'}), 400
        pending_status = redis_client.hget('pending_otps', employeeID)
        if not pending_status:
            return jsonify({'success': False, 'message': 'No pending OTP request for this user.'}), 400
        #why this?
        user = Employee.query.filter_by(employeeID=employeeID).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found in database.'}), 400
        current_time = datetime.now(timezone.utc)
        otp_expiry = user.otpexpiry
        if otp_expiry is None:
            return jsonify({'success': False, 'message': 'No OTP expiry set. Please request a new OTP.'}), 400
        if otp_expiry.tzinfo is None:
            otp_expiry = otp_expiry.replace(tzinfo=timezone.utc)
        if current_time > otp_expiry:
            return jsonify({'success': False, 'message': 'OTP has expired'}), 400
            #main check
        if not str(otp) == str(user.otpcode):
            return jsonify({'success': False, 'message': "OTP Doesn't match!"}), 400
        else:
            #clean up redis otp:
            redis_client.hdel('pending_otps', employeeID)
            #set otp_bypass for 24hrs
            redis_client.setex(f'otp_bypass:{employeeID}', 24*60*60, '1')
            #clean otp storage
            user.otpcode = None
            user.otpexpiry = None
            db.session.commit()
            return complete_user_login(user, employeeID)

        
    @app.route('/api/me', methods=['GET'])
    @jwt_required()
    def me():
        emp_id = get_jwt_identity()
        user = Employee.query.filter_by(employeeID=emp_id).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'})
        program_name = user.program.programCode if user.program else None
        return jsonify({
            'success': True,
            'user': {
                'employeeID': user.employeeID,
                'firstName': user.fName,
                'lastName': user.lName,
                'programID': user.programID,
                'programCode': program_name,
                'suffix' : user.suffix,
                'email': user.email,
                'contactNum': user.contactNum,
                'profilePic': user.profilePic,
                'isAdmin': user.isAdmin,
                'role': 'admin' if user.isAdmin else 'user'
            }
        }), 200
    
    @app.route('/api/validate-session', methods=['POST'])
    def validate_session():
        try:
            session_id = request.json.get('session_id')
            print(f"Validating session: {session_id}")  # Debug log
            
            if not session_id:
                return jsonify({'valid': False, 'error': 'No session ID'}), 400
            
            # Check if session exists in Redis
            redis_key = f'session:{session_id}'
            exists = redis_client.exists(redis_key)
            print(f"Redis key {redis_key} exists: {exists}")  # Debug log
            
            if not exists:
                return jsonify({'valid': False}), 401
            
            return jsonify({'valid': True}), 200
            
        except Exception as e:
            print(f"Validation error: {e}")
            return jsonify({'valid': False, 'error': str(e)}), 500

        
    @app.route('/api/protected', methods=["GET"])
    @jwt_required()
    def protected():
         # Access the identity of the current user with get_jwt_identity
        current_user = get_jwt_identity()
        return jsonify(logged_in_as=current_user), 200
    
    
    # REFRESH TOKEN ENDPOINT
    @app.route('/api/refresh-token', methods=["POST"])
    @jwt_required(refresh=True)  # This decorator requires refresh token, not access token
    def refresh():
        try:
            # Get the user identity from the refresh token
            current_user_id = get_jwt_identity()
            
            # Fetch user from database to get latest info
            user = Employee.query.filter_by(employeeID=current_user_id).first()
            
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # Create new access token with fresh data
            new_access_token = create_access_token(
                identity=current_user_id,
                expires_delta=timedelta(minutes=15),
                additional_claims={
                    'role': 'admin' if user.isAdmin else 'user',
                    'firstName': user.fName,
                    'lastName': user.lName
                }
            )
            
            # Optionally create new refresh token (recommended for security)
            new_refresh_token = create_refresh_token(
                identity=current_user_id,
                expires_delta=timedelta(days=7)
            )
            
            # Prepare updated user data
            user_data = {
                'employeeID': user.employeeID,
                'firstName': user.fName,
                'lastName': user.lName,
                'suffix': user.suffix,
                'email': user.email,
                'contactNum': user.contactNum,
                'profilePic': user.profilePic,
                'isAdmin': user.isAdmin,
                'role': 'admin' if user.isAdmin else 'user'
            }
            
            resp = jsonify({
                'success': True,
                'message': 'Token refreshed successfully',
                'access_token': new_access_token,
                'refresh_token': new_refresh_token,
                'user': user_data
            })
            # Also set cookies so subsequent requests with credentials include them
            try:
                from flask_jwt_extended import set_access_cookies, set_refresh_cookies
                set_access_cookies(resp, new_access_token)
                set_refresh_cookies(resp, new_refresh_token)
            except Exception as _:
                pass
            return resp, 200
            
        except Exception as e:
            # Audit failed token refresh instead of repeating new token
            if current_user_id:
                user = Employee.query.filter_by(employeeID=current_user_id).first()
                if user:
                    new_log = AuditLog(
                        employeeID=current_user_id,
                        action=f"{user.lName}, {user.fName} {user.suffix or ''}. TOKEN REFRESH FAILED. Admin={user.isAdmin}"
                    )
                    db.session.add(new_log)
                    db.session.commit()

            current_app.logger.error(f"Token refresh error: {e}")
            return jsonify({'success': False, 'message': 'Token refresh failed'}), 500
    

    def get_session_from_request():
        # Get session ID from request headers or body
        session_id = request.json.get('sessionId') if request.is_json else None
        return session_id

    #Audit session expired
    @app.route('/api/session-expired', methods=["POST"])
    def sessionExpired():
        try:
            data = request.get_json() or {}
            empID = data.get('employeeID')
            session_id = data.get('session_id')

            # Clean up session from Redis
            if session_id:
                redis_key = f'session:{session_id}'
                redis_client.delete(redis_key)
                redis_client.hdel('user_status', empID)

            # Clean up user from online users (if empID provided)
            if empID:
                redis_client.srem('online_users', empID)
            
            # Always return success for logout (even if empID missing)
            resp = jsonify({'success': True})
            unset_jwt_cookies(resp) 

            # Audit session expired
            user = Employee.query.filter_by(employeeID=empID).first()
            new_log = AuditLog(
                employeeID = empID,
                action = f"{user.lName}, {user.fName} {user.suffix}. SESSION EXPIRED. Admin={user.isAdmin}"
            )
            db.session.add(new_log)
            db.session.commit()

            return resp
            
        except Exception as e:
            print(f"Logout error: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
        
    # Audit Logout
    @app.route('/api/logout', methods=["POST"])
    @jwt_required()
    def logout():
        try:
            data = request.get_json() or {}
            empID = data.get('employeeID')
            session_id = data.get('session_id')

            # Clean up session from Redis
            if session_id:
                redis_key = f'session:{session_id}'
                redis_client.delete(redis_key)
                redis_client.hdel('user_status', empID)

            # Clean up user from online users (if empID provided)
            if empID:
                redis_client.srem('online_users', empID)
            
            # Always return success for logout (even if empID missing)
            resp = jsonify({'success': True})
            unset_jwt_cookies(resp) 

            # Audit successful logouts
            user = Employee.query.filter_by(employeeID=get_jwt_identity()).first()
            new_log = AuditLog(
                employeeID = empID,
                action = f"{user.lName}, {user.fName} {user.suffix}. LOGGED OUT. Admin={user.isAdmin}"
            )
            db.session.add(new_log)
            db.session.commit()

            return resp
            
        except Exception as e:
            print(f"Logout error: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500



    # ============================================ DASHBOARD ROUTES ============================================

    @app.route('/api/announcement/post', methods=["POST"])
    @jwt_required()
    def post_announce():
        try:
            data = request.get_json()
            title = data.get("title") 
            message = data.get("message")
            duration = data.get("duration")
            userID = get_jwt_identity()

            duration = datetime.strptime(duration, "%Y-%m-%d").date()


            new_announcement = Announcement(
                employeeID = userID,
                announceTitle = title, 
                announceText = message, 
                duration = duration
                )
            db.session.add(new_announcement)

            # Audit new announcement
            currentUser = Employee.query.filter_by(employeeID=userID).first()
            new_log = AuditLog(
                employeeID = currentUser.employeeID,
                action = f"{currentUser.lName}, {currentUser.fName} {currentUser.suffix} CREATED ANNOUNCEMENT {title}"
            )
            db.session.add(new_log)
            db.session.commit()
            
            # Real-time notifications: notify all active users about the announcement
            try:
                from app.socket_handlers import create_notification
                # Notify every employee except the author
                employees = Employee.query.with_entities(Employee.employeeID).all()
                for (emp_id,) in employees:
                    if str(emp_id) == str(userID):
                        continue
                    create_notification(
                        recipient_id=str(emp_id),
                        notification_type='announcement',
                        title=title or 'New Announcement',
                        content=message or '',
                        sender_id=str(userID),
                        link='/Dashboard'
                    )
            except Exception as notify_err:
                current_app.logger.error(f"Announcement notification emit failed: {notify_err}")

            return jsonify({'success': True, 'message': 'Announcement created successfully'}), 200 
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to create announcement, {e}'}), 500

    @app.route('/api/announcements', methods=["GET"])
    def get_announcements():
        try:            
            announcement = (Announcement.query
                            .join(Employee, Employee.employeeID == Announcement.employeeID)
                            .add_columns(
                                Announcement.announceID,
                                Announcement.announceTitle,
                                Announcement.announceText,
                                Announcement.duration,
                                Employee.fName,
                                Employee.lName,
                                Employee.suffix                                
                            )).all()

            result = []

            for ann in announcement:
                announce_data = {
                    'announceID': ann.announceID,
                    'announceTitle': ann.announceTitle,
                    'announceText': ann.announceText,
                    'duration': ann.duration,
                    'author': f"{ann.fName} {ann.lName} {ann.suffix or ''}".strip()
                }
                
                result.append(announce_data)
                
            return jsonify(result), 200
        
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to fetch announcements, {e}'}), 500

    @app.route('/api/announcement/delete/<int:announcement_id>', methods=['DELETE'])
    @jwt_required()
    def delete_announcement(announcement_id):
        try:
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403

            announcement = Announcement.query.filter_by(announceID=announcement_id).first()
            if not announcement:
                return jsonify({'success': False, 'message': 'Announcement not found'}), 404

            db.session.delete(announcement)

            # Audit deleted announcement
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} DELETED ANNOUNCEMENT {announcement.announceTitle}"
            )
            db.session.add(new_log)
            db.session.commit()

            return jsonify({'success': True, 'message': 'Announcement deleted successfully'}), 200

        except Exception as e:
            current_app.logger.error(f"Delete announcement error: {e}")
            return jsonify({'success': False, 'message': 'Failed to delete announcement'}), 500

        

    

    # ============================================ USER PAGE ROUTES ============================================

    # CREATE USER
    @app.route('/api/user', methods=["POST"])
    @jwt_required()
    def create_user():
        # admin-only
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403

        # get the user input 
        data = request.form
        profilePic = request.files.get("profilePic")  #  Do not override this
        empID = data.get("employeeID", "").strip()
        password = data.get("password", "").strip()
        first_name = data.get("fName", "").strip()
        last_name = data.get("lName", "").strip()
        suffix = data.get("suffix", "").strip()
        email = data.get("email", "").strip()
        contactNum = data.get("contactNum", "").strip()
        programID = data.get("programID")
        areaID = data.get("areaID")
        isAdmin = str(data.get("isAdmin", "false")).lower() in ["true", "1", "yes", "y"]
        created_at = datetime.now()

        # email regex for validation
        validEmail = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        
        # Validate required fields
        if not password:
            return jsonify({'success': False, 'message': 'Password cannot be empty'}), 400
        if not empID:
            return jsonify({'success': False, 'message': 'Employee ID is required'}), 400
        if not first_name:
            return jsonify({'success': False, 'message': 'First name is required'}), 400
        if not last_name:
            return jsonify({'success': False, 'message': 'Last name is required'}), 400
        if not email or not re.match(validEmail, email):
            return jsonify({'success': False, 'message': 'Please enter a valid email'}), 400
        if not contactNum or not re.match(r'^\d{11}$', contactNum):
            return jsonify({'success': False, 'message': 'Contact number must be 11 digits'}), 400
        
        # === Handle the Profile Picture (optional) ===
        profilePicPath = None
        if profilePic:  #  Only validate and upload if provided
            if profilePic.filename == '':
                return jsonify({'success': False, 'message': 'No selected file'}), 400
            
            allowed_extensions = {'jpg', 'png'}
            if '.' not in profilePic.filename:
                return jsonify({'success': False, 'message': 'Invalid file format'}), 400

            file_extension = profilePic.filename.rsplit('.', 1)[1].lower()
            if file_extension not in allowed_extensions:
                return jsonify({'success': False, 'message': 'Invalid file format. Only jpg and png allowed.'}), 400

            # Build Nextcloud path
            path = f"UDMS_Repository/Profile_Pictures"
            encoded_path = safe_path(path)
            ensure_directories(encoded_path)

            filename = f"{empID}.{file_extension}"
            filename = secure_filename(filename)

            if not filename:
                return jsonify({'success': False, 'message': 'Invalid filename'}), 400

            # Upload to Nextcloud
            response = upload_to_nextcloud(profilePic, encoded_path)
            if response.status_code not in (200, 201, 204):
                return jsonify({
                    'success': False,
                    'message': 'Nextcloud profile picture upload failed.',
                    'status': response.status_code,
                    'details': response.text
                }), 400
            
            profilePicPath = f"{path}/{filename}"  # Save path if uploaded

        # Checks if the user already exists
        if Employee.query.filter_by(employeeID=empID).first():
            return jsonify({'success': False, "message": "Employee already exists"}), 400

        # Create user
        new_user = Employee(
            employeeID=empID,
            password=generate_password_hash(password, method="pbkdf2:sha256"),
            fName=first_name,
            lName=last_name,
            suffix=suffix,
            email=email,
            contactNum=contactNum,
            profilePic=profilePicPath, 
            programID=programID,
            areaID=areaID,
            isAdmin=isAdmin,
            created_at=created_at
        )
        db.session.add(new_user)

        # Audit created user
        new_log = AuditLog(
            employeeID = admin_user.employeeID,
            action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} CREATED NEW USER {last_name}, {first_name} {suffix}. Admin={isAdmin}"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Employee created successfully!',
            'profilePic': profilePicPath,  # Return None if no upload
        }), 200

 
        

    #Reset user password (for fixing invalid password hashes)
    @app.route('/api/user/<string:employeeID>/reset-password', methods=["POST"])
    @jwt_required()
    def reset_user_password(employeeID):
        # admin-only
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        try:
            data = request.get_json()
            new_password = data.get("newPassword")
            
            if not new_password or len(new_password.strip()) == 0:
                return jsonify({'success': False, 'message': 'New password cannot be empty'}), 400
            
            user = Employee.query.filter_by(employeeID=employeeID).first()
            if not user:
                return jsonify({'success': False, 'message': 'Employee not found'}), 404
            
            # Update with properly hashed password
            user.password = generate_password_hash(new_password)
            db.session.commit()
            
            return jsonify({'success': True, 'message': f'Password reset successfully for employee {employeeID}'}), 200
            
        except Exception as e:
            current_app.logger.error(f"Password reset error: {e}")
            return jsonify({'success': False, 'message': 'Failed to reset password'}), 500

    #Delete the user 
    @app.route('/api/user/<string:employeeID>', methods=["DELETE"])
    @jwt_required()
    def delete_user(employeeID):
        # admin-only
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        user = Employee.query.filter_by(employeeID=employeeID).first()

        if not user:
            return jsonify({"success": False, "message": "Employee does not exists"}), 404
        
        db.session.delete(user)

        # Audit deleted user
        new_log = AuditLog(
            employeeID = admin_user.employeeID,
            action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} DELETED THE USER {user.lName}, {user.fName} {user.suffix}"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({"success": True, "message":"Employee has been deleted successfully!"}), 200

    #Check for users with invalid password hashes
    @app.route('/api/users/check-invalid-passwords', methods=["GET"])
    def check_invalid_passwords():
        try:
            users_with_invalid_passwords = []
            all_users = Employee.query.all()
            
            for user in all_users:
                if not user.password or len(user.password.strip()) == 0:
                    users_with_invalid_passwords.append({
                        'employeeID': user.employeeID,
                        'name': f"{user.fName} {user.lName}",
                        'email': user.email,
                        'issue': 'Empty password hash'
                    })
                else:
                    # Try to validate the hash format by attempting to parse it
                    try:
                        # This will raise ValueError if the hash format is invalid
                        _hash_internal(user.password, 'test')
                    except ValueError:
                        users_with_invalid_passwords.append({
                            'employeeID': user.employeeID,
                            'name': f"{user.fName} {user.lName}",
                            'email': user.email,
                            'issue': 'Invalid hash format'
                        })
                    except Exception:
                        # If we can't even test the hash, it's definitely invalid
                        users_with_invalid_passwords.append({
                            'employeeID': user.employeeID,
                            'name': f"{user.fName} {user.lName}",
                            'email': user.email,
                            'issue': 'Corrupted hash format'
                        })
            
            return jsonify({
                'success': True, 
                'count': len(users_with_invalid_passwords),
                'users': users_with_invalid_passwords
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Check invalid passwords error: {e}")
            return jsonify({'success': False, 'message': 'Failed to check passwords'}), 500

    #Test specific user's password hash
    @app.route('/api/user/<string:employeeID>/test-password', methods=["GET"])
    def test_user_password(employeeID):
        try:
            user = Employee.query.filter_by(employeeID=employeeID).first()
            if not user:
                return jsonify({'success': False, 'message': 'Employee not found'}), 404
            
            result = {
                'employeeID': user.employeeID,
                'name': f"{user.fName} {user.lName}",
                'email': user.email,
                'hasPassword': bool(user.password),
                'passwordLength': len(user.password) if user.password else 0,
                'passwordPreview': user.password[:20] + '...' if user.password and len(user.password) > 20 else user.password
            }
            
            # Test if the hash format is valid
            if user.password:
                try:
                    _hash_internal(user.password, 'test')
                    result['hashValid'] = True
                    result['hashError'] = None
                except ValueError as e:
                    result['hashValid'] = False
                    result['hashError'] = str(e)
                except Exception as e:
                    result['hashValid'] = False
                    result['hashError'] = f"Unexpected error: {str(e)}"
            else:
                result['hashValid'] = False
                result['hashError'] = 'No password set'
            
            return jsonify({'success': True, 'user': result}), 200
            
        except Exception as e:
            current_app.logger.error(f"Test password error: {e}")
            return jsonify({'success': False, 'message': 'Failed to test password'}), 500



    # ============================================ DATA FETCHING ROUTES ============================================

    # Gets the data count for user, programs, and institutes                                        
    @app.route('/api/count', methods=["GET"])
    def get_count():
        employee_count = (Employee.query.count())                                            
        program_count = (Program.query.count())                                            
        institute_count = (Institute.query.count())      
        deadline_count = (Deadline.query.count())      

        return jsonify({'employees' : employee_count, 'programs' : program_count, 'institutes' : institute_count, 'deadlines' : deadline_count  })                                    
                                                            
    # GET USER PROFILE BY EMPLOYEE ID
    @app.route('/api/profile/<string:employeeID>', methods=["GET"])
    @jwt_required()
    def get_user_profile(employeeID):
        try:
            # Query user with additional related data
            user = (Employee.query
                   .outerjoin(Program, Employee.programID == Program.programID)
                   .outerjoin(Area, Employee.areaID == Area.areaID)
                   .filter(Employee.employeeID == employeeID)
                   .add_columns(
                       Employee.employeeID,
                       Employee.fName, 
                       Employee.lName,
                       Employee.suffix,
                       Employee.email,
                       Employee.contactNum,
                       Employee.profilePic,
                       Employee.isAdmin,
                       Program.programName,
                       Program.programCode,
                       Area.areaName,
                       Area.areaNum
                   ).first())
            
            if not user:
                return jsonify({
                    'success': False, 
                    'message': 'Employee not found'
                }), 404
            
            # Prepare detailed profile data
            profile_data = {
                'employeeID': user.employeeID,
                'firstName': user.fName,
                'lastName': user.lName, 
                'suffix': user.suffix or '',
                'email': user.email,
                'contactNumb': user.contactNum,  # Note: matches your frontend expectation
                'profilePic': user.profilePic,
                'isAdmin': user.isAdmin,
                'role': 'admin' if user.isAdmin else 'user',
                # Additional program/area info for profile display
                'programName': user.programName or 'Not Assigned',
                'programCode': user.programCode or 'N/A', 
                'areaName': user.areaName or 'Not Assigned',
                'areaNum': user.areaNum or 'N/A'
            }
            
            return jsonify({
                'status': 'success',  # Note: matches your frontend check
                'success': True,
                'data': profile_data
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Get profile error: {e}")
            return jsonify({
                'success': False, 
                'message': 'Failed to fetch profile'
            }), 500
        
    # Get profile picture
    @app.route('/api/user/profile-pic/<string:employeeID>', methods=["GET"])
    @jwt_required()
    def get_profile_pic(employeeID):
        token = request.args.get("token")

        if token:
            try:
                decoded = decode_token(token) # validate the token manually
            except exceptions.JWTDecodeError:
                return jsonify({"success": False, "message": "Invalid token"}), 401
            
        else:
            verify_jwt_in_request()  # fallback to Authorization header

        NEXTCLOUD_URL = os.getenv("NEXTCLOUD_URL")
        NEXTCLOUD_USER = os.getenv("NEXTCLOUD_USER")
        NEXTCLOUD_PASSWORD = os.getenv("NEXTCLOUD_PASSWORD")
        
        print(f"Nextcloud config - URL: {NEXTCLOUD_URL is not None}, User: {NEXTCLOUD_USER is not None}, Password: {NEXTCLOUD_PASSWORD is not None}")


        if not all([NEXTCLOUD_URL, NEXTCLOUD_USER, NEXTCLOUD_PASSWORD]):
            return jsonify({
                'success': False,
                'message': 'Nextcloud Configuration missing'
            }), 500

        user = Employee.query.filter_by(employeeID=employeeID).first()
        if not user or not user.profilePic:
            print(f"User or profile pic not found for employee: {employeeID}")
            return jsonify({'success': False, 'message': 'Profile Picture not found'}), 404
        
        print(f"Profile pic path: {user.profilePic}")

        # Fetch from nextcloud
        response = preview_from_nextcloud(user.profilePic)  
        print(f"Nextcloud response status: {response.status_code}")        
           
        if response.status_code == 200:
            return Response(
                response.iter_content(chunk_size=8192),
                content_type=response.headers.get("Content-Type", "image/jpeg"),
                headers={
                    "Content-Disposition": f'inline; filename="{employeeID}.jpg"'
                }
            )
        else:
            return jsonify({
                'success': False,
                'status': response.status_code,
                'detail': response.text
            }), response.status_code

    @app.route('/api/profile', methods=['POST'])
    @jwt_required()
    def change_profile():
        current_user = get_jwt_identity()
        user = Employee.query.filter_by(employeeID=current_user).first()

        if not user:
            return jsonify({'success': False, 'message': 'you cannot edit this user.'}), 404
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'no data passed.'}), 400

            suffix = data.get('suffix')
            email = data.get('email')
            contactNum = data.get('contactNum')
            experience = data.get('experience')
            password = data.get('password')

            if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
            if password and len(password) < 6:
                return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
            if suffix is not None:
                user.suffix = suffix
            if email is not None:
                user.email = email
            if contactNum is not None:
                user.contactNum = contactNum
            if experience is not None:
                user.experiences = experience
            if password is not None:
                user.password = generate_password_hash(password, method="pbkdf2:sha256")
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'updated_user_data': {
                    'firstName': user.fName,
                    'lastName': user.lName,
                    'suffix': user.suffix,
                    'email': user.email,
                    'experience': user.experiences,
                    'contactNum': user.contactNum,
                }
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': 'Failed to update profile.'})

                                                            
    #Get the users 
    @app.route('/api/users', methods=["GET"])
    @jwt_required()
    def get_users():
        users  = (Employee.query
                  .join(Program, Employee.programID == Program.programID)
                  .join(Area, Employee.areaID == Area.areaID)
                  .add_columns(
                      Employee.employeeID,
                      Program.programName,
                      Area.areaName,
                      Area.areaNum,
                      Employee.fName,
                      Employee.lName,
                      Employee.suffix,
                      Employee.email,
                      Employee.contactNum,
                      Employee.profilePic,
                      Employee.isAdmin,
                      Employee.isOnline,
                  ).all()                
                )        
        
        user_list = []
        for user in users:
            user_data = {
                'employeeID': user.employeeID,
                'programName': user.programName,
                'areaName': user.areaName,
                'areaNum': user.areaNum,
                'name': f"{user.fName} {user.lName} {user.suffix or ''}",
                'email': user.email,
                'contactNum': user.contactNum,
                'profilePic': f"/api/user/profile-pic/{user.employeeID}" if user.profilePic else None,
                'isAdmin': user.isAdmin,
                'isOnline': user.isOnline
            } 
        
            user_list.append(user_data)
        return jsonify({"users" : user_list}), 200

    # ============================================ INSTITUTES PAGE ROUTES ============================================
    
    #edit institute base on institute 
    
    ALLOWED_EXTENSION = {'jpg', 'jpeg', 'png', 'webp'}
    
    @app.route('/api/institute/<int:instID>', methods=['PUT'])
    @jwt_required()    
    def edit_institute(instID):
    
        # Edit an existing institute by ID
        # Expects JSON data with institute information
        
        try:
            # Check admin permissions
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403
            
            # Find the institute to edit
            institute = Institute.query.filter_by(instID=instID).first()
            
            if not institute:
                return jsonify({'success': False, 'message': 'Institute not found'}), 
            
            content_type = request.content_type or ''
            
            # If request is multipart/form-data (for file upload)
            if 'multipart/form-data' in request.content_type:
                data = request.form
                inst_code = data.get('instCode')
                inst_name = data.get('instName')
                employee_id = data.get('employeeID')
                inst_pic_file = request.files.get('instPic')  # Optional new logo file
                
                if inst_code: 
                    institute.instCode = inst_code
                if inst_name: 
                    institute.instName = inst_name
                if employee_id is not None:
                    institute.employeeID = employee_id.strip() if employee_id and employee_id.strip() else None
                
                # If user uploaded new logo, push to Nextcloud instead of local
                if inst_pic_file and inst_pic_file.filename:
                    allowed_extensions = {'jpg', 'jpeg','png', 'webp'}
                    if '.' not in inst_pic_file.filename:
                        return jsonify({'success': False, 'message': 'Invalid file format'}), 400
                    
                    file_extension = inst_pic_file.filename.rsplit('.', 1)[1].lower()
                    if file_extension not in allowed_extensions:
                        return jsonify({
                            'success': False, 
                            'message': 'Invalid file format. Only jpg, jpeg, png, webp allowed.'
                        }), 400

                    # Construct filename: always based on instCode
                    filename = secure_filename(f"{institute.instCode}.{file_extension}")
                    
                    # Path inside Nextcloud (example: Institutes/logos/<filename>)
                    nc_path = f"Institutes/logos/{filename}"

                    # Upload/overwrite to Nextcloud
                    response, status = edit_file_nextcloud(nc_path, inst_pic_file.read())
                    if status not in (200, 201, 204):
                        return jsonify({
                            "success": False,
                            "message": f"Failed to upload file to Nextcloud: {response.get_json() if response.is_json else response}"
                        }), status

                    # Store the Nextcloud relative path in DB
                    institute.instPic = nc_path

            else:
                # JSON payload (no file)
                data = request.get_json()
                if 'instCode' in data:
                    institute.instCode = data.get('instCode')
                if 'instName' in data:
                    institute.instName = data.get('instName')
                if 'employeeID' in data:
                    employee_id = data.get('employeeID')
                    institute.employeeID = employee_id.strip() if employee_id and employee_id.strip() else None
            
            # audit edit of institute
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} EDITED THE INSTITUTE {institute.instName}"
            )
            db.session.add(new_log)
            # Save changes
            db.session.commit()
            
            # Get dean info for response
            dean = institute.dean if institute.employeeID else None
            dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}".strip() if dean else "N/A"
            
            return jsonify({
                'success': True,
                'message': 'Institute updated successfully',
                'data': {
                    'instID': institute.instID,
                    'instCode': institute.instCode,
                    'instName': institute.instName,
                    'instPic': institute.instPic,  # Now stored as Nextcloud path
                    'instDean': dean_name,
                    'employeeID': institute.employeeID
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Edit institute error: {str(e)}")
            return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


    @app.route('/api/institutes', methods=['POST'])
    @jwt_required()
    def create_institute():
        try:
            data = request.form
            instCode = data.get('instCode')
            instName = data.get("instName")
            instPic = request.files.get('instPic')
            employee_id = data.get('employeeID')

            if not instCode or not instName:
                return jsonify({'success': False, 'message': 'Institute code and name are required'}), 400

            if not instPic:
                return jsonify({'success': False, 'message': 'Institute logo (instPic) is required'}), 400

            if instPic.filename == '':
                return jsonify({'success': False, 'message': 'No file selected'}), 400

            allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
            if '.' not in instPic.filename:
                return jsonify({'success': False, 'message': 'Invalid file format'}), 400

            file_extension = instPic.filename.rsplit('.', 1)[1].lower()
            if file_extension not in allowed_extensions:
                return jsonify({'success': False, 'message': 'Invalid file format. Only jpg, jpeg, png, webp allowed.'}), 400

            # Create uploads folder if missing
            upload_folder = os.path.join(current_app.root_path, "uploads")
            os.makedirs(upload_folder, exist_ok=True)

            filename = f"{instCode}.{file_extension}"
            filename = secure_filename(filename)

            save_path = os.path.join(upload_folder, filename)
            instPic.save(save_path)

            # Save just the filename in DB (not full path)
            instPicPath = filename

            new_institute = Institute(
                instCode=instCode,
                instName=instName,
                instPic=instPicPath,
                employeeID=employee_id.strip() if employee_id and employee_id.strip() else None
            )
            db.session.add(new_institute)

            # Audit new institute
            admin_user = Employee.query.filter_by(employeeID=get_jwt_identity()).first()
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} CREATED INSTITUTE {instName}"
            )
            db.session.add(new_log)
            db.session.commit()

            dean = new_institute.dean
            dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A"

            return jsonify({
                'success': True,
                'message': 'Institute Created Successfully',
                'instID': new_institute.instID,
                'instCode': new_institute.instCode,
                'instName': new_institute.instName,
                'instPic': new_institute.instPic,
                'instDean': dean_name,
                'employeeID': new_institute.employeeID
            })

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Create Institute error: {str(e)}")
            return jsonify({'error': f'Failed to create institute {str(e)}'}), 500



    #Delete institute by ID
    @app.route('/api/institute/<int:instID>', methods=['DELETE'])
    @jwt_required()
    def delete_institute(instID):
        try:
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403

            institute = Institute.query.filter_by(instID=instID).first()
            if not institute:
                return jsonify({'error': 'Institute not found'}), 404

            updated_counts = {}
            programs_updated = Program.query.filter_by(instID=instID).update({'instID': None})
            updated_counts['programs'] = programs_updated
            
            areas_updated = Area.query.filter_by(instID=instID).update({'instID': None})
            updated_counts['areas'] = areas_updated
            
            deadlines_updated = 0
            if hasattr(Deadline, 'instID'):
                deadlines_updated = Deadline.query.filter_by(instID=instID).update({'instID': None})
            updated_counts['deadlines'] = deadlines_updated
            
            db.session.delete(institute)

            # Audit deleted institute
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} DELETED INSTITUTE {institute.instName}"
            )
            db.session.add(new_log)
            db.session.commit()

            return jsonify({
                'success': True, 
                'message': f'Institute deleted successfully. Related records preserved but unlinked.',
                'deletedID': instID,
                'updated_counts': updated_counts
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Delete institute error: {str(e)}")
            return jsonify({'error': 'Database error occurred'}), 500


    #Get the institute
    @app.route('/api/institute', methods=["GET"])
    def get_institute():
        institutes = Institute.query.all()
                    
        institute_list = []

        for institute in institutes:

            dean = institute.dean

            institute_data = {
                'instID': institute.instID,

                'instDean': f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A",

                'instCode': institute.instCode,
                'instName': institute.instName,
                'instPic': institute.instPic,
                'employeeID': institute.employeeID  # Include the foreign key ID
            } 
            institute_list.append(institute_data)
        return jsonify({"institutes": institute_list}), 200
    

    @app.route('/api/institute/logos/<string:instCode>', methods=["GET"])
    def get_institute_logo(instCode):
        institute = Institute.query.filter_by(instCode=instCode).first()
        if not institute or not institute.instPic:
            return jsonify({"success": False, "message": "Institute logo not found"}), 404
            
        # Validate Nextcloud configuration
        NEXTCLOUD_URL = os.getenv("NEXTCLOUD_URL")
        NEXTCLOUD_USER = os.getenv("NEXTCLOUD_USER")
        NEXTCLOUD_PASSWORD = os.getenv("NEXTCLOUD_PASSWORD")
        if not all([NEXTCLOUD_URL, NEXTCLOUD_USER, NEXTCLOUD_PASSWORD]):
            return jsonify({
                'success': False,
                'message': 'Nextcloud configuration missing on server'
            }), 500

        raw = (institute.instPic or '').strip()
        # Build candidate paths to match your structure UDMS_Repository/Institutes/Logos
        candidates = []
        if raw:
            filename = os.path.basename(raw)
            name, ext = os.path.splitext(filename)
            if raw.startswith('UDMS_Repository/'):
                # Try exact DB path first
                candidates.append(raw)
                # If it fails, try swapping common image extensions
                if name and ext:
                    dir_prefix = raw[: -len(filename)]
                    for e in ['.png', '.jpg', '.jpeg', '.webp']:
                        if ext.lower() != e:
                            candidates.append(f"{dir_prefix}{name}{e}")
            else:
                if name:
                    exts = [ext] if ext else []
                    for e in ['.png', '.jpg', '.jpeg', '.webp']:
                        if e not in exts:
                            exts.append(e)
                    for e in exts:
                        fname = f"{name}{e}" if e else filename
                        candidates.append(f"UDMS_Repository/Institutes/Logos/{fname}")
                        candidates.append(f"UDMS_Repository/Institutes/logos/{fname}")  
                candidates.append(f"UDMS_Repository/{raw}")

        response = None
        for p in candidates:
            r = preview_from_nextcloud(p)
            if getattr(r, 'status_code', 500) == 200:
                response = r
                break

        if response and response.status_code == 200:
            content_type = response.headers.get("Content-Type", "application/octet-stream")
            return Response(response.content, content_type=content_type)
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch logo for {instCode}",
                "status": getattr(response, 'status_code', 500),
                "detail": getattr(response, "text", "No response text")
            }), getattr(response, 'status_code', 500)            

    # Fetch programs for the institute
    @app.route('/api/institute/programs', methods=["GET"])
    def get_program_for_inst():
        instID = request.args.get('instID', type=int)

        programs = Program.query.filter_by(instID=instID).all()

        program_list = [
            {
                'programID': p.programID,
                'programCode': p.programCode,
                'programName': p.programName,
            }
            for p in programs
        ]

        return jsonify({'programs': program_list}), 200

    
    # ============================================ PROGRAM PAGE ROUTES ============================================
    
    #edit program base on program id
    @app.route('/api/program/<int:programID>', methods=['PUT'])
    @jwt_required()
    def edit_program(programID):
        try:
            # Admin only
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403

            data = request.get_json() # Get JSON data from frontend
            program = Program.query.filter_by(programID=programID).first()

            if not program:
                return jsonify({'success': False, 'message': 'Program not found'}), 404

            # Update the database fields with new values
            program.programCode = data.get('programCode', program.programCode)      # Update program code (e.g., "BSIT")
            program.programName = data.get('programName', program.programName)      # Update program name
            program.programColor = data.get('programColor', program.programColor)   # Update program color
            program.employeeID = data.get('employeeID', program.employeeID)         # Handle employeeID - accept string format like "23-45-678"
            program.instID = data.get('instID', program.instID)

            # Audit edited program
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} EDITED THE PROGRAM {program.programName}"
            )
            db.session.add(new_log)
            db.session.commit() # Save changes to database

            return jsonify({        
                'success': True,
                'message': 'Program updated successfully',
                'data': {
                    'programID': program.programID,
                    'programCode': program.programCode,
                    'programName': program.programName,
                    'programColor': program.programColor,
                    'employeeID': program.employeeID,
                    'instID': program.instID
                }
            }), 200

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Edit program error: {str(e)}")
            return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

    #Create new program
    @app.route('/api/program', methods=['POST'])
    @jwt_required()
    def create_program():
        try:
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403
            data = request.get_json()  # Get JSON data from frontend
            
            # Handle employeeID - accept string format like "23-45-678"
            employee_id = data.get('employeeID')
            final_employee_id = employee_id.strip() if employee_id and str(employee_id).strip() else None
            
            # Parse instID and validate it
            inst_id = data.get('instID')
            if inst_id is not None:
                # If provided, ensure institute exists
                inst = Institute.query.filter_by(instID=inst_id).first()
                if not inst:
                    return jsonify({
                        'success': False,
                        'message': 'Institute not found'
                    }), 400
            
            # Create new program object with instID to fetch in College modal
            new_program = Program(
                programCode = data.get('programCode'),
                programName = data.get('programName'),
                programColor = data.get('programColor'),
                employeeID = final_employee_id,
                instID = inst_id # associate program with institute
            )
            
            db.session.add(new_program)  # Add to database

            # Audit new program
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} CREATED NEW PROGRAM {data.get('programName')}"
            )
            db.session.add(new_log)
            db.session.commit()  # Save changes
            
            # Get the dean info for response (same as edit route)
            dean = new_program.dean
            dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A"
            
            return jsonify({
                'success': True,
                'message': 'Program Created Successfully',
                'programID': new_program.programID,
                'programCode': new_program.programCode,
                'programName': new_program.programName,
                'programColor': new_program.programColor,
                'programDean': dean_name,
                'employeeID': new_program.employeeID,
                'instID': new_program.instID
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Create program error: {str(e)}")
            return jsonify({'error': 'Failed to create program'}), 500

    #Delete program by ID
    @app.route('/api/program/<int:programID>', methods=['DELETE'])
    @jwt_required()
    def delete_program(programID):
        try:
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403

            programs = Program.query.filter_by(programID=programID).first()
            
            if not programs:
                return jsonify({'error': 'Program not found'}), 404
            
            updated_counts = {}
            
            employees_updated = Employee.query.filter_by(programID=programID).update({'programID': None})
            updated_counts['employees'] = employees_updated
            
            areas_updated = Area.query.filter_by(programID=programID).update({'programID': None})
            updated_counts['areas'] = areas_updated
            
            deadlines_updated = Deadline.query.filter_by(programID=programID).update({'programID': None})
            updated_counts['deadlines'] = deadlines_updated
        
            db.session.delete(programs)

            # Audit deleted program
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} DELETED PROGRAM {programs.programName}"
            )
            db.session.add(new_log)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Program deleted successfully. {employees_updated} employees, {areas_updated} areas, and {deadlines_updated} deadlines are now unlinked.',
                'deletedID': programID,
                'updated_counts': updated_counts
            }), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Delete program error: {str(e)}")
            return jsonify({'error': 'Database error occurred'}), 500

    @app.route('/api/program', methods=['GET'])
    @jwt_required()
    def get_user_program():
        try:
            current_user_id = get_jwt_identity()
            current_user = Employee.query.filter_by(employeeID=current_user_id).first()
            
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # If user is admin, return all programs
            if current_user.isAdmin:
                programs = Program.query.all()
            else:
                # If regular user, return only their assigned program
                programs = Program.query.filter_by(programID=current_user.programID).all()
                    
            program_list = []
            for program in programs:
                dean = program.dean
                program_data = {
                    'programID': program.programID,
                    'programDean': f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A",
                    'programCode': program.programCode,
                    'programName': program.programName,
                    'programColor': program.programColor,
                    'employeeID': program.employeeID
                }
                program_list.append(program_data)

            return jsonify({
                'success': True,
                'programs': program_list,
                'isAdmin': current_user.isAdmin
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Get user program error: {e}")
            return jsonify({'success': False, 'message': 'Failed to fetch programs'}), 500


    # ============================================ Criteria And Area Route ============================================

    # Mark criteria as done or not done
    @app.route('/api/criteria/<int:criteriaID>/done', methods=["PUT"])
    def mark_criteria_done(criteriaID):
        data = request.get_json()
        is_done = data.get('isDone')
        
        criteria = Criteria.query.filter_by(criteriaID=criteriaID).first()

        if not criteria:
            return jsonify({'success': False, 'message': 'Criteria not found'}), 404
        
        criteria.isDone = is_done

        db.session.commit()

        return jsonify({'success': True, 'message': 'Criteria marked as done'}), 200

    @app.route('/api/area/progress', methods=["PUT"])
    def save_area_progress():
        data = request.get_json()
        areaID = data.get("areaID")
        progress = data.get("progress")
        updated_at = datetime.utcnow()
 
        if areaID is None or progress is None:
            return jsonify({'success': False, 'message': 'areaID and progress are required'}), 400
        
        area = Area.query.filter_by(areaID=areaID).first()

        area.progress = progress
        area.updated_at = updated_at


        db.session.commit()

        return jsonify({'success': True, 'message': 'Area progress saved!'}), 200


    # ============================================ Notifications ============================================
    @app.route('/api/notifications', methods=['GET', 'OPTIONS'])
    def notifications_options_handler():
        if request.method == 'OPTIONS':
            return ('', 204)
        return get_notifications()

    @jwt_required()
    def get_notifications():
        try:
            current_user_id = get_jwt_identity()
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)

            notifications = Notification.query.filter_by(recipientID=current_user_id)\
            .order_by(Notification.createdAt.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

            notification_list = []
            for notif in notifications.items:
                sender_info = None
                if notif.senderID:
                    sender = Employee.query.get(notif.senderID)
                    if sender:
                        sender_info = {
                            'employeeID': sender.employeeID,
                            'name': f'{sender.fName} {sender.lName}',
                            'profilePic': sender.profilePic if sender.profilePic else None
                        }
                notification_list.append({
                    'notificationID': notif.notificationID,
                    'type': notif.type,
                    'title': notif.title,
                    'content': notif.content,
                    'createdAt': notif.createdAt.isoformat() if notif.createdAt else None,
                    'isRead': notif.isRead,
                    'link': notif.link,
                    'sender': sender_info
                })
            return jsonify({
                'success': True,
                'notifications': notification_list,
                'total': notifications.total,
                'pages': notifications.pages,
                'current_page': page
            }), 200
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to fetch notifications: {e}'}), 500
    
    
    @app.route('/api/notifications/<int:notification_id>/read', methods=['PUT', 'OPTIONS'])
    def mark_notification_read_options(notification_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        return mark_notification_read_impl(notification_id)

    @jwt_required()
    def mark_notification_read_impl(notification_id):
        try:
            current_user_id = get_jwt_identity()
            notification = Notification.query.filter_by(
                notificationID=notification_id,
                recipientID=current_user_id
            ).first()
            
            if not notification:
                return jsonify({'success': False, 'message': 'Notification not found'}), 404
            
            notification.isRead = True
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Notification marked as read'}), 200
            
        except Exception as e:
            current_app.logger.error(f"Mark notification read error: {e}")
            return jsonify({'success': False, 'message': 'Failed to update notification'}), 500

    @app.route('/api/notifications/<int:notification_id>', methods=['DELETE', 'OPTIONS'])
    def delete_notification_options(notification_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        return delete_notification_impl(notification_id)

    @jwt_required()
    def delete_notification_impl(notification_id):
        try:
            current_user_id = get_jwt_identity()
            notification = Notification.query.filter_by(
                notificationID=notification_id,
                recipientID=current_user_id
            ).first()
            
            if not notification:
                return jsonify({'success': False, 'message': 'Notification not found'}), 404
            
            db.session.delete(notification)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Notification deleted'}), 200
            
        except Exception as e:
            current_app.logger.error(f"Delete notification error: {e}")
            return jsonify({'success': False, 'message': 'Failed to delete notification'}), 500

    @app.route('/api/notifications', methods=['DELETE', 'OPTIONS'])
    def delete_all_notifications_options():
        if request.method == 'OPTIONS':
            return ('', 204)
        return delete_all_notifications_impl()

    @jwt_required()
    def delete_all_notifications_impl():
        try:
            current_user_id = get_jwt_identity()
            Notification.query.filter_by(recipientID=current_user_id).delete()
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'All notifications deleted'}), 200
            
        except Exception as e:
            current_app.logger.error(f"Delete all notifications error: {e}")
            return jsonify({'success': False, 'message': 'Failed to delete notifications'}), 500

    @app.route('/api/notifications/mark-all-read', methods=['PUT', 'OPTIONS'])
    def mark_all_notifications_read_options():
        if request.method == 'OPTIONS':
            return ('', 204)
        return mark_all_notifications_read_impl()

    @jwt_required()
    def mark_all_notifications_read_impl():
        try:
            current_user_id = get_jwt_identity()
            Notification.query.filter_by(
                recipientID=current_user_id,
                isRead=False
            ).update({'isRead': True})
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'All notifications marked as read'}), 200
            
        except Exception as e:
            current_app.logger.error(f"Mark all notifications read error: {e}")
            return jsonify({'success': False, 'message': 'Failed to mark notifications as read'}), 500

    @app.route('/api/notifications/unread-count', methods=['GET', 'OPTIONS'])
    def get_unread_count_options():
        if request.method == 'OPTIONS':
            return ('', 204)
        return get_unread_count_impl()

    @jwt_required()
    def get_unread_count_impl():
        try:
            current_user_id = get_jwt_identity()
            count = Notification.query.filter_by(
                recipientID=current_user_id,
                isRead=False
            ).count()
            
            return jsonify({'success': True, 'count': count}), 200
            
        except Exception as e:
            current_app.logger.error(f"Get unread count error: {e}")
            return jsonify({'success': False, 'message': 'Failed to get unread count'}), 500

    # ============================================ Dashboard: Audit Logs & Pending Docs ============================================
    @app.route('/api/auditLogs', methods=['GET', 'OPTIONS'])
    @jwt_required()
    def get_audit_logs():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            logs = (AuditLog.query.order_by(AuditLog.createdAt.desc()).limit(100).all())
            results = [{
                'logID': l.logID,
                'employeeID': l.employeeID,
                'action': l.action,
                'createdAt': l.createdAt.isoformat() if l.createdAt else None,
            } for l in logs]
            return jsonify({ 'success': True, 'data': { 'logs': results } }), 200
        except Exception as e:
            current_app.logger.error(f"Get audit logs error: {e}")
            return jsonify({ 'success': False, 'error': 'Failed to fetch logs' }), 500

    @app.route('/api/pendingDocs', methods=['GET', 'OPTIONS'])
    @jwt_required()
    def get_pending_docs():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            # Consider pending as documents that are not approved yet (isApproved is NULL)
            pending = Document.query.filter((Document.isApproved.is_(None))).order_by(Document.docID.desc()).limit(100).all()
            def serialize_doc(d: Document):
                # best-effort fields to match frontend expectations
                name = getattr(d, 'docName', None) or getattr(d, 'fileName', None) or 'Document'
                return {
                    'pendingDocID': getattr(d, 'docID', None),
                    'pendingDocName': name,
                }
            return jsonify({ 'success': True, 'data': { 'pendingDocs': [serialize_doc(d) for d in pending] } }), 200
        except Exception as e:
            current_app.logger.error(f"Get pending docs error: {e}")
            return jsonify({ 'success': False, 'error': 'Failed to fetch pending documents' }), 500

    @app.route('/api/program/approve', methods=["PUT"])
    @jwt_required()
    def approve_document():
        data = request.get_json()
        docID = data.get("docID")

        document = Document.query.filter_by(docID=docID).first()

        document.isApproved = True
        document.approvedBy = get_jwt_identity()
        document.evaluate_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'success': True, 'message': 'Document approved!'}), 200


    @app.route('/api/program/reject', methods=["PUT"])
    @jwt_required()
    def reject_document():
        data = request.get_json()
        docID = data.get("docID")

        document = Document.query.filter_by(docID=docID).first()

        document.isApproved = False
        document.approvedBy = get_jwt_identity()
        document.evaluate_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'success': True, 'message': 'Document Rejected!'}), 200


    @app.route('/api/criteria', methods=["GET"])
    def get_criteria(): 

        criteria = Criteria.query.all()

        results = []

        for c in criteria:
            criteria_data ={
                'criteriaID': c.criteriaID,
                'criteriaContent': c.criteriaContent,
                'criteriaName': f"{c.criteriaID}. {c.criteriaContent}",
                'isDone': c.isDone
            }
            results.append(criteria_data)

        return jsonify(results)


    #Get the area for displaying in tasks
    @app.route('/api/area', methods=["GET"])
    def get_area():
        areas = (Area.query
                 .join(Program, Area.programID == Program.programID)
                 .order_by(Area.areaID.asc())                 
                 .outerjoin(Subarea, Area.areaID == Subarea.areaID)                 
                 .add_columns(
                    Area.areaID,
                    Area.programID,
                    Area.subareaID,
                    Program.programCode,                
                    Area.areaName,
                    Area.areaNum,
                    Area.progress,
                    Subarea.subareaName
                )
            ).all()

        area_list = []

        for area in areas:
            area_data = {
                'areaID' : area.areaID,
                'programID': area.programID,
                'subareaID': area.subareaID,    
                'programCode': area.programCode,
                'areaTitle': area.areaName,
                'areaNum': area.areaNum,
                'areaName': f"{area.areaNum}: {area.areaName}",
                'progress': area.progress,
                'subareaName': area.subareaName,                
            }
            area_list.append(area_data)
        

        return jsonify({"area": area_list}), 200    


    #Create deadline
    @app.route('/api/deadline', methods=["POST"])
    def create_deadline():        
        data = request.form
        #gets the data input from the frontend forms
        programID = data.get("program")
        areaID = data.get("area")
        content = data.get("content")
        criteriaID = data.get("criteria") 
        due_date = data.get("due_date")             
        
        try:
            # Create a new deadline 
            new_deadline = Deadline(
                programID=programID,
                areaID=areaID,
                criteriaID=criteriaID,  
                content=content,
                due_date=due_date
            )

            db.session.add(new_deadline)
            db.session.commit()

            return jsonify({'success': True, 'message': 'Deadline created successfully!'}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to create deadline: {str(e)}'}), 500


    # ============================================ Tasks Route ============================================
    

    @app.route('/api/deadlines', methods=["GET"]) 
    def get_deadline():

        deadlines = (Deadline.query
                     .join(Program, Deadline.programID == Program.programID)
                     .join(Area, Deadline.areaID == Area.areaID)
                     .add_columns(
                         Deadline.deadlineID,
                         Program.programName,
                         Program.programCode,
                         Program.programColor,
                         Area.areaName,
                         Area.areaNum,
                         Deadline.due_date,
                         Deadline.content
                     )).all()
     
        deadline_list = []

        for dl in deadlines: 
            deadline_data = {                            
                'deadlineID': dl.deadlineID,
                'programName': dl.programName,
                'programColor': dl.programColor,
                'programCode': dl.programCode,                               
                'areaName': dl.areaNum + ": " + dl.areaName, 
                'due_date': dl.due_date.strftime('%m-%d-%Y'),
                'content': dl.content
            }
            deadline_list.append(deadline_data)

        return jsonify({'deadline': deadline_list})
    
    #get the events for the calendar
    @app.route('/api/events', methods=["GET"])
    def get_events():
    
        events = (Deadline.query
                     .join(Program, Deadline.programID == Program.programID)
                     .join(Area, Deadline.areaID == Area.areaID)
                     .add_columns(
                         Deadline.deadlineID,
                         Program.programName,
                         Program.programColor,
                         Area.areaName,
                         Area.areaNum,
                         Deadline.due_date,
                         Deadline.content
                     )).all()
        
        event_list = []

        for e in events:
            event = {
                'id': e.deadlineID,
                'title': f"{e.areaNum}: {e.areaName}",
                'start': e.due_date.strftime('%Y-%m-%d'),
                'content': e.content,
                'color': e.programColor
            }
     
            event_list.append(event)
        
        return jsonify(event_list)
        


    # ============================================ Accreditation Routes ============================================

    @app.route('/api/accreditation', methods=["GET"])
    def get_areas():
        program_code = request.args.get('programCode')

        data = (
        db.session.query(
            Area.areaID,
            Program.programCode,
            Area.areaName,
            Area.areaNum,
            Area.progress,
            Subarea.subareaID,
            Subarea.subareaName,
            Criteria.criteriaID,
            Criteria.criteriaContent,
            Criteria.criteriaType,
            Criteria.rating,
            Document.docID,
            Document.docName,
            Document.docType,
            Document.docPath,
            Document.isApproved,
            Document.predicted_rating
        )
        .outerjoin(Program, Area.programID == Program.programID)
        .outerjoin(Subarea, (Area.areaID == Subarea.areaID) & (Subarea.archived == False))
        .outerjoin(Criteria, (Subarea.subareaID == Criteria.subareaID) & (Criteria.archived == False))
        .outerjoin(Document, Criteria.docID == Document.docID)       
        .filter(Program.programCode == program_code, Area.archived == False)
        .order_by(Area.areaID.asc(), Subarea.subareaID.asc(), Criteria.criteriaID.asc())
        .all()
    )


        result = {}
        for row in data:
            area_id = row.areaID
            subarea_id = row.subareaID

            if area_id not in result:
                result[area_id] = {                    
                'areaID': row.areaID,
                'programCode': row.programCode,
                'areaNum': row.areaNum,
                'areaName': row.areaNum + ": " + row.areaName, 
                'subareas': {}                  
            }
                

            if subarea_id and subarea_id not in result[area_id]['subareas']:
                result[area_id]["subareas"][subarea_id] = {
                    'subareaID': subarea_id,
                    'subareaName': row.subareaName,
                    'criteria': {
                        'inputs': [],
                        'processes': [],
                        'outcomes': [],
                },  
                    
            }
            
            if row.criteriaContent:
                criteria_data = {
                    'criteriaID': row.criteriaID ,
                    'content': row.criteriaContent,
                    'docID': row.docID,
                    'docName': row.docName,
                    'docPath': row.docPath,
                    'predicted_rating': row.predicted_rating,
                    'isApproved': row.isApproved,
                    'rating': row.rating
                }

            match row.criteriaType:
                case "Inputs":
                    result[area_id]['subareas'][subarea_id]['criteria']['inputs'].append(criteria_data)
                case "Processes":
                    result[area_id]['subareas'][subarea_id]['criteria']['processes'].append(criteria_data)
                case "Outcomes":
                    result[area_id]['subareas'][subarea_id]['criteria']['outcomes'].append(criteria_data)

        for area in result.values():
            area['subareas'] = list(area['subareas'].values())


        return jsonify(list(result.values())) 
    
    @app.route('/api/accreditation/create_area', methods=["POST"])
    @jwt_required()
    def create_area():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        data = request.form
        programID = data.get("programID")
        areaNum = data.get("areaNum")
        areaName = data.get("areaName")

    # create new area

        new_area = Area(
            programID = programID,
            areaName = areaName,
            areaNum = areaNum
        )
        db.session.add(new_area)

        # Audit new area
        new_log = AuditLog(
            EmployeeID = admin_user.employeeID,
            action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} CREATED NEW AREA {areaName}"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({'message' : 'Area created successfully!'}), 200


    @app.route('/api/accreditation/create_subarea', methods=["POST"])
    @jwt_required()
    def create_sub_area():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        data = request.form
        areaID = data.get("selectedAreaID")
        subareaName = data.get("subAreaName")

        area = Area.query.get(areaID)
        # Check if the area exists
        if not area:
            return jsonify({'error': 'Area not found'}), 404


        new_subArea = Subarea(subareaName = subareaName)
        area.subareas.append(new_subArea)
        db.session.add(new_subArea)

        # Audit new subarea
        new_log = AuditLog(
            employeeID = admin_user.employeeID,
            action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} CREATED NEW SUBAREA {subareaName}"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({'message': 'Sub-Area created successfully!'}), 200

        
    @app.route('/api/accreditation/create_criteria', methods=["POST"])
    @jwt_required()
    def create_criteria():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        data = request.form
        subareaID = data.get("selectedSubAreaID")
        criteriaContent = data.get("criteria")
        criteriaType = data.get("criteriaType")

        subarea = Subarea.query.get(subareaID)

        if not subarea:
            return jsonify({'error': 'Subarea not found'}), 404
        
        new_criteria = Criteria(
            subareaID = subareaID,
            criteriaContent = criteriaContent,
            criteriaType = criteriaType
        )
        subarea.criteria.append(new_criteria)
        db.session.add(new_criteria)

        # Audit new criteria
        new_log = AuditLog(
            employeeID = admin_user.employeeID,
            action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} CREATED NEW CRITERIA {criteriaType} IN {subarea.subareaName}"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({'message': 'Criteria created successfully!'}), 200
    
    # ===== Load Models for Document Processing =====

    # Model for genarating embeddings
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2") 
    # Model for predicting document rating
    model_path = os.path.join(os.path.dirname(__file__), "machine_learning", "xgb_best_model.pkl")
    xgb_model = joblib.load(model_path)


    @app.route('/api/accreditation/upload', methods=["POST"])
    @jwt_required()        
    def upload_file():        

       # ==== Get and Validate Form Data ====
        # Get form data
        data = request.form
        file = request.files.get("uploadedFile")
        file_type = request.form.get("fileType")
        file_name = request.form.get("fileName")
        criteria_id = request.form.get("criteriaID")
               
        program_code = data.get("programCode")
        area_name = data.get("areaName")
        subarea_name = data.get("subareaName")
        criteria_type = data.get("criteriaType")
        
        # === Validate the File ===
        if not file:
            return jsonify({'success': False, 'message': 'No file provided'}), 400

        # Make sure filename exists
        if not getattr(file, "filename", None):
            return jsonify({'success': False, 'message': 'Invalid file: no filename detected'}), 400

        # Ensure filename has an extension
        if '.' not in file.filename:
            return jsonify({'success': False, 'message': 'Invalid file name (missing extension)'}), 400

        # Extract extension safely
        file_extension = file.filename.rsplit('.', 1)[-1].lower()
        allowed_extensions = {'pdf'}

        if file_extension not in allowed_extensions:
            return jsonify({'success': False, 'message': 'Invalid file format. Only PDF files are allowed.'}), 400

        # Generate a secure filename
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'success': False, 'message': 'Invalid filename'}), 400
        
        # Get uploader info
        try:
            uploader = Employee.query.filter_by(employeeID=get_jwt_identity()).first()
        
            if not uploader:
                return jsonify({'success': False, 'message': 'User not found'}), 400
            
        except Exception as e:
            return jsonify({'success': False, 'message': 'Authentication error'}), 400
        
        # ==== Save File ====

        # Gets the file url
        path = f"UDMS_Repository/Accreditation/Programs/{program_code}/{area_name}/{subarea_name}/{criteria_type}/{criteria_id}"
        normalized_path = normalize_path(path)    

        # Generates a secure filename
        filename = secure_filename(file.filename)

        if not filename:
            return jsonify({'success': False, 'message': 'Invalid filename'}), 400
                       
        try:            
             # === Ensures that the directory exists in Nextcloud ===
            if not ensure_directories(path):
                return jsonify({
                    'success': False,
                    'message': 'Failed to create directory structure in Nextcloud'
                }), 400

            # === Save file to Nextcloud ===
            response = upload_to_nextcloud(file, path)
            if response.status_code not in (200, 201, 204):
                return jsonify({
                    'success': False,
                    'message': 'Nextcloud upload failed.',
                    'status': response.status_code,
                    'details': response.text
                }), 400
                                    
            # === Extract the text from file ===

            temp_path = f"/tmp/{filename}"

            file.save(temp_path) 
                # Extract text then remove the file
            try:
                extracted_text = extract_pdf(temp_path) 
                file_size = os.path.getsize(temp_path)                               
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            # === Generate Tags === 
            tags = set(rule_based_tag(extracted_text))
            
            # Fetch all documents in the DB
            all_docs = [d.content for d in Document.query.with_entities(Document.content).all()]
            all_docs.append(extracted_text)

            tfidf_tags = extract_global_tfid_tags(all_docs, len(all_docs) - 1)
            if tfidf_tags:
                # Flatten tfidf_tags if it's a list of lists
                from itertools import chain
                if any(isinstance(tag, list) for tag in tfidf_tags):
                    flat_tags = list(chain.from_iterable(tfidf_tags))
                    tags.update(flat_tags)
                else:
                    tags.update(tfidf_tags)

           # === Generate Embedding ===
            embedding = embedding_model.encode(extracted_text, normalize_embeddings=True)
            embedding = np.array(embedding, dtype=np.float32).tolist()
            
                                   
           # ==== Create or update document record ====
            doc = Document.query.filter_by(docName=file_name).first()

            if doc:
                # Update existing doc
                doc.docPath = f"{normalized_path}/{filename}"
                doc.docName = file_name
                doc.content = extracted_text
                doc.tags = list(tags)
                doc.embedding = embedding

                # Audit updated doc
                new_log = AuditLog(
                    employeeID = uploader.employeeID,
                    action = f"{uploader.lName}, {uploader.fName} {uploader.suffix} UPDATED DOCUMENT {filename}"
                )
                db.session.add(new_log)

            else:
                # Create new doc
                doc = Document(
                    docName=file_name,
                    docType=file_type,
                    docPath=f"{path}/{filename}",
                    content=extracted_text,
                    employeeID=uploader.employeeID,
                    tags=list(tags),
                    embedding=embedding
                )
                db.session.add(doc)
                db.session.flush()  # Assign docID before linking

                # Audit new doc
                new_log = AuditLog(
                    employeeID = uploader.employeeID,
                    action = f"{uploader.lName}, {uploader.fName} {uploader.suffix} UPLOADED NEW DOCUMENT {filename}"
                )
                db.session.add(new_log)

            # ==== Link document to criteria ====
            criteria = Criteria.query.get(criteria_id)

            if not criteria:
                db.session.rollback()
                return jsonify({'success': False, 'message': 'Criteria not found'}), 404

            criteria.docID = doc.docID  # Always safe, since doc exists now

            # ==== Update search vector ====
            db.session.execute(
                text("""
                    UPDATE document
                    SET search_vector = to_tsvector('english', "docName" || ' ' || content)
                    WHERE "docID" = :doc_id
                """),
                {"doc_id": doc.docID}
            )

            # ==== Compute Days Until Deadline ====
            if not hasattr(criteria, "deadlines") or not criteria.deadlines:
                days_until_deadline = 0  # fallback if no deadlines linked
            else:
                nearest_deadline = min(dl.due_date for dl in criteria.deadlines)
                days_until_deadline = (nearest_deadline - datetime.utcnow().date()).days

            # ===== Compute Criteria Completion Score =====
            criteria_list = Criteria.query.filter_by(subareaID=criteria.subareaID).count()
            completed_criteria = Criteria.query.filter_by(subareaID=criteria.subareaID, isDone=True).count()
            criteria_completion_score = (completed_criteria / criteria_list) * 100 if criteria_list > 0 else 0

            # ====== Get program ID ======
            program = Program.query.filter_by(programCode=program_code).first()
            programID = program.programID if program else None

            # =========== Build Feature for Rating Prediction ===============

            df_input = pd.DataFrame([{
                "file_size": file_size,
                "Criteria_Completion_Score": criteria_completion_score,
                "Days_Until_Deadline": days_until_deadline,
                "isApproved": False,
                "docType": "application/pdf",
                "programID": programID     
            }])

            emb = pd.DataFrame([embedding])
            emb.columns = [f"emb_{i}" for i in range(len(emb.columns))]

            X_new = pd.concat([df_input, emb], axis=1)

            # Predit the rating
            predicted_rating = float(xgb_model.predict(X_new)[0])

            doc.predicted_rating = predicted_rating
            
            # Final commit
            db.session.commit()

            return jsonify({
                'success': True, 
                'message': 'File uploaded successfully!', 
                'filePath': f"{normalized_path}/{filename}",
                'predict_rating': round(predicted_rating, 2),
                'status': response.status_code 
            }), 200
            
        except Exception as e:
            db.session.rollback()  # Rollback on error
            return jsonify({'success': False, 'message': f'Failed to upload file: {str(e)}'}), 400
        

    # Preview file
    @app.route('/api/accreditation/preview/<filename>', methods=["GET"])   
    @jwt_required()   
    def preview_file(filename):                       
        
        doc = Document.query.filter_by(docName=filename).first()
        if doc:
            print("DB docPath:", doc.docPath)
        else:
            print("No document found with this name")

        if not doc:
            return jsonify({'success': False, 'message': 'File not found.'}), 404    

        # Get the file
        response = preview_from_nextcloud(doc.docPath)
        
        if response.status_code == 200:
            return Response(
                response.iter_content(chunk_size=8192),
                content_type = response.headers.get("Content-Type", "application/octet-stream"),
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"'
                }
            ) 
        else:
            return jsonify({
                'success': False,
                'status': response.status_code,
                'detail': response.text 
            }), response.status_code    



       
    # ============================================ Documents Routes ============================================

    # display all the documents inside nextcloud repo
    @app.route('/api/documents', methods=["GET"])
    def list_files():
        try:
            tree = list_files_from_nextcloud()
            return jsonify(tree)
            
        except Exception as e:
            return jsonify({"Error": str(e)}), 500

    
    @app.route('/api/documents/preview/<path:file_path>', methods=["GET"])
    def preview_file_documents(file_path):
        return preview_file_nextcloud(file_path)
    
    @app.route('/api/documents/download/<path:file_path>', methods=["GET"])
    @jwt_required()
    def download_file_documents(file_path):
        # Audit downloaded file
        user = Employee.query.filter_by(employeeID=get_jwt_identity()).first()
        file_name = file_path.split("/")[-1]
        new_log = AuditLog(
            employeeID = user.employeeID,
            action = f"{user.lName}, {user.fName} {user.suffix} DOWNLOADED {file_name}"
        )
        db.session.add(new_log)
        db.session.commit()

        return download_file_nextcloud(file_path)
    
    
    @app.route('/api/documents/delete_file/<int:docID>', methods=["DELETE"])
    @jwt_required()
    def delete_file(docID):
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        try:
            # Check if metadata exists first
            doc = Document.query.get(docID)
            if not doc:
                return jsonify({
                    'success': False,
                    'message': 'Document not found.'
                }), 404

            file_path = doc.docPath
            print(f"Deleting docID = {docID}, path = {file_path}")
            if file_path.startswith('UDMS_Repository/'):
                file_path = file_path.replace("UDMS_Repository/", "", 1)

            # Delete from Nextcloud
            response = delete_from_nextcloud(file_path)

            if response.status_code not in (200, 204):
                return jsonify({
                    'success': False,
                    'message': 'Nextcloud deletion failed.',
                    'status': response.status_code,
                    'details': response.text
                }), 400

            # Delete metadata from DB only if Nextcloud deletion succeeded
            db.session.delete(doc)

            # Audit deleted doc
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} DELETED THE FILE {doc.docName}"
            )
            db.session.add(new_log)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'File deleted successfully.'
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': f'Failed to delete document: {str(e)}'
            }), 500



    @app.route('/api/documents/rename', methods=["PUT"])
    @jwt_required()
    def rename_file():        
        data = request.get_json()
        old_path = data.get("oldPath")
        new_path = data.get("newPath")

        try:
            response = rename_file_nextcloud(old_path, new_path)

            if response.status_code in (200, 201, 204, 207):
                # Skip folders                
                if os.path.splitext(new_path)[1] == "":
                    return jsonify({
                        'success': True,
                        'message': 'Folder renamed in Nextcloud but not tracked in DB.'
                    }), 200
                
                display_name = unquote(new_path)
                # Update DB only if it's a file
                doc = Document.query.filter_by(docPath=old_path).first()
                if doc:
                    doc.docPath = display_name
                    user = Employee.query.filter_by(employeeID=get_jwt_identity()).first()
                    # Audit rename path
                    new_log = AuditLog(
                        employeeID = user.employeeID,
                        action = f"{user.lName}, {user.fName} {user.suffix} RENAMED FILE {doc.docName}"
                    )
                    db.session.add(new_log)
                    db.session.commit()
                else:                 
                    return jsonify({'success': True, 'message': 'File renamed successfully.'}), 200
                
            else:
                return jsonify({
                    'success': False,
                    'message': 'Nextcloud rename failed. Please try again.',
                    'status': response.status_code,
                    'details': response.text
                }), 400
        except Exception as e:
            return jsonify({'success': False, 'message': f'Failed to rename document {str(e)}'}), 500

    @app.route('/api/documents/upload', methods=["POST"])
    @jwt_required()
    def upload_documents():
        file = request.files.get('uploadedFile')
        data = request.form
        file_type = data.get("fileType")
        file_name = data.get("fileName")
        directory = data.get("directory", "").strip('/')

        base_path = "UDMS_Repository"

        if not directory:
            directory = base_path
        else:
            directory = f"{base_path}/{directory}"

        if not file:
            return jsonify({'success': False, 'message': 'No file provided'}), 400        

        if not file.filename or '.' not in file.filename:
            return jsonify({'success': False, 'message': 'Invalid file name'}), 400

        # Get uploader info
        uploader = Employee.query.filter_by(employeeID=get_jwt_identity()).first()
        if not uploader:
            return jsonify({'success': False, 'message': 'User not found'}), 400
        
        filename = secure_filename(file.filename)

        # Upload to Nextcloud
        response = upload_to_nextcloud(file, directory)

        # Audit successful upload
        new_log = AuditLog(
            employeeID = uploader.employeeID,
            action = f"{uploader.lName}, {uploader.fName} {uploader.suffix} UPLOADED {filename}"
        )
        db.session.add(new_log)
        db.session.commit()

        if response.status_code not in (200, 201, 204):
            return jsonify({
                "success": False,
                "message": f"Upload failed: {response.status_code} {response.text}"
            }), 500

        # === Extract text ===
        extracted_text = ""
        temp_path = f"/tmp/{filename}"
        try:
            file.save(temp_path) 

            file_extension = filename.rsplit('.', 1)[-1].lower()
            if file_extension == 'pdf':
                extracted_text = extract_pdf(temp_path)
            elif file_extension in ('docx', 'doc'):
                extracted_text = extract_docs(temp_path)
            elif file_extension in ('xls', 'xlsx'):
                extracted_text = extract_excel(temp_path)
            elif file_extension in ('jpg', 'png', 'jpeg'):
                extracted_text = extract_image(temp_path) 
            else:
                extracted_text = "" # could be extended for txt, etc.            

        except Exception as e:
            return jsonify({'success': False, 'message': f'Text extraction failed: {str(e)}'}), 500
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
       # === Generate Tags === 
        tags = set(rule_based_tag(extracted_text))
        
        # Fetch all documents in the DB
        all_docs = [d.content for d in Document.query.with_entities(Document.content).all()]
        all_docs.append(extracted_text)

        tfidf_tags = extract_global_tfid_tags(all_docs, len(all_docs) - 1)
        if tfidf_tags:
            # Flatten tfidf_tags if it's a list of lists
            from itertools import chain
            if any(isinstance(tag, list) for tag in tfidf_tags):
                flat_tags = list(chain.from_iterable(tfidf_tags))
                tags.update(flat_tags)
            else:
                tags.update(tfidf_tags)

        # === Generate Embedding ===
        embedding = embedding_model.encode(extracted_text, normalize_embeddings=True)
        embedding = np.array(embedding, dtype=np.float32).tolist()
        
        
        # === Save record to DB ===
        try:
            doc = Document(
                docName=file_name,
                docType=file_type,
                docPath=f"{directory}/{filename}",
                content=extracted_text,
                employeeID=uploader.employeeID,
                tags=list(tags),
                embedding=embedding
            )
            db.session.add(doc)
            db.session.flush() # Assign docID before updating search vector

            # ==== Update search vector ====
            db.session.execute(
                text("""
                    UPDATE document
                    SET search_vector = to_tsvector('english', "docName" || ' ' || content)
                    WHERE "docID" = :doc_id
                """), 
                {"doc_id": doc.docID}
            )

            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'File uploaded successfully!'
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Database save failed: {str(e)}'}), 500

    @app.route('/api/documents/tags', methods=["GET"])
    def get_tags():

        tags = Document.query.with_entities(Document.tags).all()

        unique_tags = set()

        for tag_list, in tags:
            if tag_list:
                unique_tags.update(tag_list)
                sorted_tags = sorted(unique_tags)
        
        return jsonify(sorted_tags), 200

    @app.route('/api/documents/filter', methods=["GET"])
    def filter_by_tags():
        tag = request.args.get('tag', "").strip()

        if not tag:
            return jsonify({"error": "Tag is required"}), 400
        
        search_tag = tag.lower()

        documents = Document.query.filter(Document.tags.any(search_tag)).all()


        result = []

        for doc in documents:  
            doc_data = {
                    "docID": doc.docID,
                    "docName": doc.docName,
                    "docTags": doc.tags,
                    "docPath": doc.docPath,
                }
            
            result.append(doc_data)

        return jsonify(result), 200
            


        
    @app.route('/api/search', methods=["GET"])
    def search_document():
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify([])

        tsquery = ' & '.join([f"{word}:*" for word in query.split()])
        query_embedding = embedding_model.encode(query).tolist()

        sql = text(""" 
            SELECT 
                d."docID", 
                d."docName", 
                d."docPath",
                ts_rank_cd(d.search_vector, to_tsquery('english', :tsquery)) as keyword_rank,
                1 - (d.embedding <=> CAST(:embedding AS vector)) AS semantic_score,
                (0.3 * ts_rank_cd(d.search_vector, to_tsquery('english', :tsquery)) +
                0.7 * (1 - (d.embedding <=> CAST(:embedding AS vector)))) AS hybrid_score,
                ts_headline('english', d.content, to_tsquery('english', :tsquery)) AS file_snippet
            FROM document d
            WHERE d.search_vector @@ to_tsquery('english', :tsquery) 
                OR d.embedding IS NOT NULL
            ORDER BY hybrid_score DESC
            LIMIT 10
        """)

        results = db.session.execute(
            sql,             
            {
                "tsquery": tsquery,
                "embedding": query_embedding
            }
        ).mappings().all()

        output = []
        for row in results:
            output.append({
                "docID": row.docID,
                "docName": row.docName,
                "docPath": row.docPath,
                "directory": row.docPath,
                'file_snippet': row.file_snippet,
                "keyword_rank": float(row.keyword_rank) if row.keyword_rank else 0,
                "semantic_score": float(row.semantic_score) if row.semantic_score else 0,
                "hybrid_score": float(row.hybrid_score) if row.hybrid_score else 0
            })

        return jsonify(output)


    # ============================================ Rating Routes ============================================
    
    @app.route('/api/accreditation/rate/criteria', methods=["POST"])
    @jwt_required()
    def save_rating():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        data = request.get_json()    
        ratings = data.get("ratings", {})        

        for criteriaID, rating in ratings.items():     
            rating = float(rating)       
            criteria = Criteria.query.get(criteriaID)
            if not criteria:
                return jsonify({'success': False, 'message': f'Criteria ID {criteriaID} not found'}), 404
            criteria.rating = rating
            db.session.add(criteria)

            # Audit rated criteria
            new_log = AuditLog(
                employeeID = admin_user.employeeID,
                action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} RATED THE CRITERIA {criteria.criteriaType}"
            )
            db.session.commit()

        return jsonify({'success': True, 'message': 'Criteria Rated Successfully!' }), 200
    
    # Get criteria ratings by program code and subarea ID
    @app.route('/api/accreditation/rate/criteria/<string:programCode>/<string:subareaID>', methods=["GET"])
    def get_criteria_ratings(programCode, subareaID):
        criteria = (
            db.session.query(
                Criteria.criteriaID,
                Criteria.criteriaContent,
                Criteria.criteriaType,
                Criteria.rating,
                Document.docID,
                Document.docName,
                Document.docPath,
                Document.predicted_rating
            )
            .outerjoin(Document, Criteria.docID == Document.docID)
            .join(Subarea, Criteria.subareaID == Subarea.subareaID)
            .join(Area, Subarea.areaID == Area.areaID)
            .join(Program, Area.programID == Program.programID)
            .filter(Program.programCode == programCode, Subarea.subareaID == subareaID)
            .all()
        )

        grouped = {
            "inputs": [],
            "processes": [],
            "outcomes": []
        }

        for c in criteria:
            criteria_data = {
                "criteriaID": c.criteriaID,
                "content": c.criteriaContent,
                "docID": c.docID,
                "docName": c.docName,
                "docPath": c.docPath,
                'predicted_rating': c.predicted_rating,
                "rating": c.rating
            }

            match c.criteriaType:
                case "Inputs":
                    grouped["inputs"].append(criteria_data)
                case "Processes":
                    grouped["processes"].append(criteria_data)
                case "Outcomes":
                    grouped["outcomes"].append(criteria_data)

        return jsonify(grouped), 200

    # Save subarea rating
    
    @app.route('/api/accreditation/rate/subarea', methods=["POST"])
    @jwt_required()
    def save_subarea_rate():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        data = request.get_json()        
        subareaID = data.get("subareaID")
        rating = float(data.get("rating"))

        subarea = Subarea.query.get(subareaID)
        if not subarea: 
            return jsonify({'success': False, 'message': 'Subarea not found'}), 404

        subarea.rating = rating

        db.session.add(subarea)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Subarea rating saved!' }), 200


    # Get subarea ratings by program code and area ID
    @app.route('/api/accreditation/rate/subarea/<string:programCode>/<string:areaID>', methods=["GET"])
    def get_subarea_ratings(programCode, areaID):
        subareas = (
            db.session.query(
                Subarea.subareaID,
                Subarea.subareaName,
                Subarea.rating            
            )
            .join(Area, Subarea.areaID == Area.areaID)
            .join(Program, Area.programID == Program.programID)
            .filter(Program.programCode == programCode, Area.areaID == areaID)
            .all()
        )
        subarea_list = []

        for sa in subareas:
            subarea_data = {
                'subareaID': sa.subareaID,
                'subareaName': sa.subareaName,
                'rating': sa.rating,
            }
            subarea_list.append(subarea_data)        

        return jsonify(subarea_list), 200

    
    @app.route('/api/accreditation/rate/area', methods=["POST"])
    @jwt_required()
    def save_area_rate():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
        data = request.get_json()        
        areaID = data.get("areaID")
        rating = float(data.get("rating"))

        area = Area.query.get(areaID)
        if not area: 
            return jsonify({'success': False, 'message': 'Area not found'}), 404

        area.rating = rating
        db.session.add(area)

        # Audit rated area
        new_log = AuditLog(
            employeeID = admin_user.employeeID,
            action = f"{admin_user.lName}, {admin_user.fName} {admin_user.suffix} RATED THE AREA {area.areaName}"
        )
        db.session.add(new_log)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Area rating saved!' }), 200



    # ============================================ Messages Routes ============================================


    @app.route('/api/users/online-status', methods=['GET'])
    @jwt_required()
    def get_users_with_status():
        empID = get_jwt_identity()
        users = Employee.query.all()
        online_users = {user.decode('utf-8') for user in redis_client.smembers('online_users')}
        users_data = []
        for user in users:
            status = redis_client.hget('user_status', user.employeeID)
            status_str = status.decode('utf-8') if status else 'active'
            users_data.append({
                'employeeID': user.employeeID,
                'fName': user.fName,
                'lName': user.lName,
                'profilePic': user.profilePic,
                'online_status': user.employeeID in online_users,
                'status': status_str
            })
        
        return jsonify({
            'success': True,
            'users': users_data
        })

    @app.route('/api/conversations', methods=['GET'])
    @jwt_required()
    def get_conversations():
        current_user_id = get_jwt_identity()
        
        # Get conversations where current user participates
        
        user_conversation_ids = db.session.query(
            ConversationParticipant.conversationID
        ).filter(
            ConversationParticipant.employeeID == current_user_id
        ).subquery()
        
        # Get other participants in those conversations
        conversations = db.session.query(
            Conversation.conversationID,
            Conversation.conversationType,
            Conversation.createdAt,
            ConversationParticipant.employeeID.label('other_participant_id'),
            Employee.fName,
            Employee.lName,
            Employee.profilePic
        ).join(
            ConversationParticipant, 
            Conversation.conversationID == ConversationParticipant.conversationID
        ).join(
            Employee, 
            ConversationParticipant.employeeID == Employee.employeeID
        ).filter(
            Conversation.conversationID.in_(user_conversation_ids),
            ConversationParticipant.employeeID != current_user_id
        ).all()
        
        # Format results (same as before)
        conversations_data = []
        for conv in conversations:
            conversations_data.append({
                'conversationID': conv.conversationID,
                'otherParticipant': {
                    'employeeID': conv.other_participant_id,
                    'name': f"{conv.fName} {conv.lName}",
                    'profilePic': conv.profilePic
                },
                'conversationType': conv.conversationType,
                'createdAt': conv.createdAt.isoformat() if conv.createdAt else None
            })
        
        return jsonify({
            'success': True,
            'conversations': conversations_data
        }), 200

            
    @app.route('/api/conversations/<int:conversation_id>/message', methods =['GET'])
    @jwt_required()
    def get_messages(conversation_id):
        current_user_id = get_jwt_identity()

        participants = ConversationParticipant.query.filter_by(
            conversationID=conversation_id,
            employeeID=current_user_id
        ).first()

        if not participants:
            return jsonify({'success': False, 'message': 'Access Denied.'}), 403

        # Exclude messages the current user chose to hide
        hidden_ids_subq = db.session.query(MessageDeletion.messageID).filter(
            MessageDeletion.employeeID == str(current_user_id)
        ).subquery()

        messages = db.session.query(Message).filter(
            Message.conversationID == conversation_id,
            ~Message.messageID.in_(hidden_ids_subq)
        ).order_by(Message.sentAt.asc()).all()

        messages_data = []
        for msg in messages:
            messages_data.append({
                'id': msg.messageID,
                'content': msg.messageContent,
                'senderID': msg.senderID,
                'createdAt': msg.sentAt.isoformat() if msg.sentAt else None,
                'isOwn': msg.senderID == current_user_id
            })

        return jsonify({
            'success': True,
            'messages': messages_data
        }), 200

    

    @app.route('/api/conversations/start', methods=['POST'])
    @jwt_required()
    def conversations_start():
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json() or {}
            participant_id = data.get('participantID')

            if not participant_id:
                return jsonify({'success': False, 'message': 'participantID is required'}), 400
            # Accept IDs that may contain non-digits (e.g., formatted IDs like 22-16-075)
            raw_pid = str(participant_id).strip()
            normalized_pid = re.sub(r'\D', '', raw_pid)
            if not raw_pid:
                return jsonify({'success': False, 'message': 'participantID is required'}), 400
            # Prevent self-conversation (compare after stripping non-digits)
            if re.sub(r'\D', '', str(current_user_id).strip()) == normalized_pid:
                return jsonify({'success': False, 'message': 'Cannot start a conversation with yourself'}), 400

            # Validate participant exists
            # Try exact string match, or match on digits-only using regexp_replace
            target_user = db.session.query(Employee).filter(
                (cast(Employee.employeeID, String) == raw_pid) |
                (func.regexp_replace(cast(Employee.employeeID, String), '[^0-9]', '', 'g') == normalized_pid)
            ).first()
            if not target_user:
                return jsonify({'success': False, 'message': 'Participant not found'}), 404
            
            # Find existing direct conversation between both users
            current_user_id_str = str(current_user_id).strip()
            participant_id_str = raw_pid

            user_conv_ids = db.session.query(
                ConversationParticipant.conversationID
            ).filter(
                ConversationParticipant.employeeID == current_user_id_str
            ).subquery()

            other_conv_ids = db.session.query(
                ConversationParticipant.conversationID
            ).filter(
                ConversationParticipant.employeeID == participant_id_str
            ).subquery()

            existing_conv = db.session.query(Conversation).filter(
                Conversation.conversationType == 'direct',
                Conversation.conversationID.in_(user_conv_ids),
                Conversation.conversationID.in_(other_conv_ids)
            ).first()

            if existing_conv:
                return jsonify({
                    'success': True,
                    'conversationID': existing_conv.conversationID,
                    'conversationType': existing_conv.conversationType,
                    'createdAt': existing_conv.createdAt.isoformat() if existing_conv.createdAt else None,
                    'otherParticipant': {
                        'employeeID': str(target_user.employeeID),
                        'name': f"{target_user.fName} {target_user.lName}",
                        'profilePic': target_user.profilePic
                    }
                }), 200

            # Create new direct conversation
            new_conv = Conversation(
                conversationType='direct',
                createdBy=current_user_id_str
            )
            db.session.add(new_conv)
            db.session.flush()

            # Add both participants
            db.session.add_all([
                ConversationParticipant(conversationID=new_conv.conversationID, employeeID=current_user_id_str),
                ConversationParticipant(conversationID=new_conv.conversationID, employeeID=participant_id_str)
            ])
            db.session.commit()

            return jsonify({
                'success': True,
                'conversationID': new_conv.conversationID,
                'conversationType': new_conv.conversationType,
                'createdAt': new_conv.createdAt.isoformat() if new_conv.createdAt else None,
                'otherParticipant': {
                    'employeeID': str(target_user.employeeID),
                    'name': f"{target_user.fName} {target_user.lName}",
                    'profilePic': target_user.profilePic
                }
            }), 201
        except Exception as e:
            current_app.logger.error(f"Start conversation error: {e}")
            return jsonify({'success': False, 'message': 'Internal server error'}), 500

    @app.route('/api/conversations/<int:conversation_id>/message', methods=['POST'])
    @jwt_required()
    def send_message(conversation_id):
        current_user_id = get_jwt_identity()
        data = request.get_json()

        participant = ConversationParticipant.query.filter_by(
            conversationID=conversation_id,
            employeeID=current_user_id
        ).first()

        if not participant:
            return jsonify({'success': False, 'message': 'Access Denied'}), 403

        content = data.get('content', '').strip()
        if not content:
            return jsonify({'success': False, 'message': 'Message cannot be empty'}), 400

        new_message = Message(
            conversationID=conversation_id,
            senderID=current_user_id,
            messageContent=content
        )

        db.session.add(new_message)
        db.session.commit()

        socketio.emit('new_message', {
            'conversationID': conversation_id,
            'message': {
                'id': new_message.messageID,
                'content': new_message.messageContent,
                'senderID': new_message.senderID,
                'createdAt': new_message.sentAt.isoformat(),
                'isOwn': False
            }
        }, room=f'conversation:{conversation_id}') 
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully'
        }), 201

    @app.route('/api/messages/<int:message_id>', methods=['DELETE'])
    @jwt_required()
    def hide_message_for_user(message_id):
        try:
            current_user_id = get_jwt_identity()
            # Ensure the message exists and user is a participant of the conversation
            msg = Message.query.filter_by(messageID=message_id).first()
            if not msg:
                return jsonify({'success': False, 'message': 'Message not found'}), 404

            is_participant = ConversationParticipant.query.filter_by(
                conversationID=msg.conversationID,
                employeeID=str(current_user_id)
            ).first() is not None
            if not is_participant:
                return jsonify({'success': False, 'message': 'Forbidden'}), 403

            # Idempotent insert: if already hidden, return success
            already = MessageDeletion.query.filter_by(
                messageID=message_id,
                employeeID=str(current_user_id)
            ).first()
            if already:
                return jsonify({'success': True}), 200

            deletion = MessageDeletion(
                messageID=message_id,
                employeeID=str(current_user_id)
            )
            db.session.add(deletion)
            db.session.commit()
            return jsonify({'success': True}), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Hide message error: {e}")
            return jsonify({'success': False, 'message': 'Internal server error'}), 500
                    
    @app.route('/api/conversations/<int:conversation_id>', methods=['DELETE'])
    @jwt_required()
    def delete_conversation(conversation_id):
        current_user_id = get_jwt_identity()

        conv = Conversation.query.filter_by(conversationID=conversation_id).first()
        if not conv:
            return jsonify({'success': False, 'message': 'Not found'}), 404

        is_participant = ConversationParticipant.query.filter_by(
            conversationID=conversation_id, employeeID=current_user_id
        ).first() is not None
        if not (is_participant or current_user_id == conv.createdBy):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403

        db.session.delete(conv)
        db.session.commit()

        socketio.emit('conversation_deleted', {'conversationID': conversation_id}, room=f'conversation:{conversation_id}')
        return jsonify({'success': True}), 200
           

    
    # ============================================ Template Routes ============================================


    @app.route('/api/templates', methods=["GET"])
    @jwt_required()
    def get_templates():            
        data = (
            db.session.query(
                Template.templateID,
                Template.templateName,
                Template.description,
                Template.createdBy,
                Template.createdAt,
                Template.isArchived,
                Employee.employeeID,
                Employee.fName,
                Employee.lName,
                Employee.suffix,                
                AreaBlueprint.areaBlueprintID,
                AreaBlueprint.areaName,
                AreaBlueprint.areaNum,
                SubareaBlueprint.subareaBlueprintID,
                SubareaBlueprint.subareaName,
                CriteriaBlueprint.criteriaBlueprintID,
                CriteriaBlueprint.criteriaContent,
                CriteriaBlueprint.criteriaType,
            )
            .outerjoin(Employee, Template.createdBy == Employee.employeeID)
            .outerjoin(AreaBlueprint, AreaBlueprint.templateID == Template.templateID)
            .outerjoin(SubareaBlueprint, SubareaBlueprint.areaBlueprintID == AreaBlueprint.areaBlueprintID)
            .outerjoin(CriteriaBlueprint, CriteriaBlueprint.subareaBlueprintID == SubareaBlueprint.subareaBlueprintID)
            .order_by(AreaBlueprint.areaBlueprintID.asc(), SubareaBlueprint.subareaBlueprintID.asc(), CriteriaBlueprint.criteriaBlueprintID.asc())
            .all()
        )


        
        template_dict = {}
        

        for row in data:
            if row.templateID not in template_dict:
                template_dict[row.templateID]= {
                    'templateID': row.templateID,
                    'templateName': row.templateName,
                    'description': row.description,
                    'createdBy': f"{row.fName} {row.lName}{row.suffix or ''}",
                    'createdAt': row.createdAt,
                    'isArchived': row.isArchived,
                    'areas': {}
                }

            template = template_dict[row.templateID]

            if row.areaBlueprintID and row.areaBlueprintID not in template["areas"]:
                template["areas"][row.areaBlueprintID] = {
                    "areaID": row.areaBlueprintID,
                    "areaName": row.areaName,
                    "areaNum": row.areaNum,
                    "subareas": {}
                }    
            if row.areaBlueprintID:
                area = template["areas"][row.areaBlueprintID]

                if row.subareaBlueprintID and row.subareaBlueprintID not in area["subareas"]:
                    area["subareas"][row.subareaBlueprintID] = {
                        "subareaID": row.subareaBlueprintID,
                        "subareaName": row.subareaName,
                        "criteria": []
                    }

                if row.subareaBlueprintID:
                    subarea = area["subareas"][row.subareaBlueprintID]

                    if row.criteriaBlueprintID:
                        subarea["criteria"].append({
                            "criteriaID": row.criteriaBlueprintID,
                            "criteriaContent": row.criteriaContent,
                            "criteriaType": row.criteriaType                        
                        })


        template_list = []

        for temp in template_dict.values():
            temp["areas"] = list(temp["areas"].values())
            for area in temp["areas"]:
                area["subareas"] = list(area["subareas"].values())
            template_list.append(temp)
        

        return jsonify(template_list),200


    @app.route('/api/templates/create', methods=["POST"])
    @jwt_required()
    def create_template():
        import traceback

        data = request.get_json()
        
        templateName = data.get("templateName")
        description = data.get("description", "")
        createdBy = get_jwt_identity()
        areas = data.get("areas", [])

        print("DEBUG incoming data:", data)
        

        try:
            new_template = Template(                
                templateName=templateName,
                description=description,
                createdBy=createdBy,
                createdAt=datetime.utcnow(),
                isArchived=False
            )   

            db.session.add(new_template)
            db.session.flush()

            created_areas = []

            for area in areas:
                # Parse the area name                                
            
                area_bp = AreaBlueprint(
                    templateID=new_template.templateID,
                    areaName=area.get("areaName"),
                    areaNum=area.get("areaNum")            
                )

                db.session.add(area_bp)
                db.session.flush()

                created_subareas = []

                for sub in area.get("subareas", []):
                    subarea_bp = SubareaBlueprint(
                        areaBlueprintID=area_bp.areaBlueprintID,
                        subareaName=sub.get("subareaName")
                    )
                    db.session.add(subarea_bp)
                    db.session.flush()

                    created_criteria = []

                    for crit in sub.get("criteria", []):
                        criteria_bp = CriteriaBlueprint(
                            subareaBlueprintID=subarea_bp.subareaBlueprintID,
                            criteriaContent=crit.get("criteriaContent", ""),
                            criteriaType=crit.get("criteriaType", ""),                            
                        )
                        db.session.add(criteria_bp)
                        db.session.flush()

                        created_criteria.append({
                            "criteriaBlueprintID": criteria_bp.criteriaBlueprintID,
                            "criteriaContent": criteria_bp.criteriaContent,
                            "criteriaType": criteria_bp.criteriaType,                            
                        })

                    created_subareas.append({
                        'subareaBlueprintID': subarea_bp.subareaBlueprintID,
                        'subareaName': subarea_bp.subareaName,
                        'criteria': created_criteria
                    })
                
                created_areas.append({
                    "areaBlueprintID": area_bp.areaBlueprintID,
                    "areaNum": area_bp.areaNum,
                    "areaName": area_bp.areaName,
                    "subareas": created_subareas
                })
            
            db.session.commit()

            return jsonify({
                "success": True,
                "message": "Template saved successfully!",
                "template": {
                    "templateID": new_template.templateID,
                    "templateName": new_template.templateName,
                    "description": new_template.description,
                    "createdBy": new_template.createdBy,
                    "createdAt": new_template.createdAt,
                    "areas": created_areas
                }
            }), 201
        

        except Exception as e:
            db.session.rollback()
            print("Save template error:", str(e))
            traceback.print_exc()
            return jsonify({"success": False, "message": f"Failed to save template: {str(e)}"}), 500


    @app.route('/api/programs/<int:programID>/apply-template/<int:templateID>', methods=["POST"])
    @jwt_required()
    def apply_template(programID, templateID):
        try:
            # Archive existing areas
            active_areas = Area.query.filter_by(programID=programID, archived=False).all()
            for area in active_areas:
                area.archived = True
                for sub in area.subareas:
                    sub.archived = True
                    for crit in sub.criteria:
                        crit.archived = True

            # Get template
            template = Template.query.filter_by(templateID=templateID).first()
            if not template:
                return jsonify({"success": False, "message": "Template not found"}), 404

            # Create applied template record
            applied_template = AppliedTemplate(
                programID=programID,
                templateID=template.templateID,
                templateName=template.templateName,
                description=template.description,
                appliedBy=get_jwt_identity()
            )
            db.session.add(applied_template)
            db.session.flush()

            # Copy areas from blueprint
            area_blueprints = AreaBlueprint.query.filter_by(templateID=templateID).all()
            for ab in area_blueprints:
                area = Area(
                    appliedTemplateID=applied_template.appliedTemplateID,
                    programID=programID,
                    areaName=ab.areaName,
                    areaNum=ab.areaNum,
                    archived=False
                )
                db.session.add(area)
                db.session.flush()

                # Copy subareas from blueprint
                subarea_blueprints = SubareaBlueprint.query.filter_by(areaBlueprintID=ab.areaBlueprintID).all()
                for sb in subarea_blueprints:
                    subarea = Subarea(
                        areaID=area.areaID,
                        subareaName=sb.subareaName,
                        archived=False
                    )
                    db.session.add(subarea)
                    db.session.flush()

                    # Copy criteria from blueprint (make sure FK matches your model)
                    criteria_blueprints = CriteriaBlueprint.query.filter_by(subareaBlueprintID=sb.subareaBlueprintID).all()
                    for cb in criteria_blueprints:
                        criteria = Criteria(
                            subareaID=subarea.subareaID,
                            criteriaContent=cb.criteriaContent,
                            criteriaType=cb.criteriaType,
                            archived=False
                        )
                        db.session.add(criteria)

            db.session.commit()
            return jsonify({'success': True, 'message': 'Template applied successfully!'}), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f"Failed to apply template {str(e)}"}), 500


