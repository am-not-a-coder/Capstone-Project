import json
from flask import jsonify, request, session, send_from_directory, current_app, Response, render_template
from app.models import Employee
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
from app.nextcloud_service import upload_to_nextcloud, preview_from_nextcloud, delete_from_nextcloud, ensure_directories, safe_path, list_files_from_nextcloud, preview_file_nextcloud, download_file_nextcloud, rename_file_nextcloud
from sentence_transformers import SentenceTransformer
import numpy as np
import mimetypes
import os
import re
import time
import redis
from app.otp_utils import generate_random
from flask_mail import Message as MailMessage
from app.login_handlers import complete_user_login
from app.models import Employee, Program, Area, Subarea, Institute, Document, Deadline, AuditLog, Announcement, Criteria, Conversation, ConversationParticipant, Message, MessageDeletion
from sqlalchemy import cast, String, func, text


def register_routes(app):
                                  #AUTHENTICATION(LOGIN/LOGOUT) PAGE ROUTES 
    
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
            
            return jsonify({
                'success': True,
                'message': 'Token refreshed successfully',
                'access_token': new_access_token,
                'refresh_token': new_refresh_token,  # Send new refresh token
                'user': user_data  # Send updated user info
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Token refresh error: {e}")
            return jsonify({'success': False, 'message': 'Token refresh failed'}), 500
    

    def get_session_from_request():
        # Get session ID from request headers or body
        session_id = request.json.get('sessionId') if request.is_json else None
        return session_id

    #LOGOUT API
    @app.route('/api/logout', methods=["POST"])
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
            return resp
            
        except Exception as e:
            print(f"Logout error: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500


                # DASHBOARD ROUTES

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
            db.session.commit()
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
    

                 #USER PAGE ROUTES

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
        profilePic = request.files.get("profilePic")  # ✅ Do not override this
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
        if profilePic:  # ✅ Only validate and upload if provided
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
            
            profilePicPath = f"{path}/{filename}"  # ✅ Save path if uploaded

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
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Employee created successfully!',
            'profilePic': profilePicPath,  # ✅ Return None if no upload
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



                                        #DATA FETCHING ROUTES

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

                    #INSTITUTES PAGE ROUTES 
    
    #edit institute base on institute id
    @app.route('/api/institute/<int:instID>', methods=['PUT'])    
    def edit_institute(instID):
        try:
            data = request.get_json()  # Get JSON data from frontend
            institutes = Institute.query.filter_by(instID=instID).first()  # Find institute by ID
            
            if institutes:
                # Update the database fields with new values
                institutes.instID = data.get('instID')      # Update institute code (e.g., "BSIT")
                institutes.instCode = data.get('instCode')      # Update institute code (e.g., "BSIT")
                institutes.instName = data.get('instName')      # Update institute name  
                institutes.instPic = data.get('instPic')    # Update institute color
                # Handle employeeID - accept string format like "23-45-678"
                employee_id = data.get('employeeID')
                if employee_id and employee_id.strip():  # Check if not empty
                    institutes.employeeID = employee_id  # Store as string (matches your DB format)
                else:
                    institutes.employeeID = None  # Set to null for empty values
                
                db.session.commit()  # Save changes to database
                
                # After saving, get the updated dean info via the foreign key relationship
                dean = institutes.dean  # This uses the relationship defined in your models.py
                dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A"
                
                return jsonify({
                    'success': True,
                    'message': 'Program Updated Successfully',
                    'updated_program': {
                        'instID': institutes.instID,
                        'instCode': institutes.instCode,
                        'instName': institutes.instName,
                        'instPic': institutes.instPic,
                        'instDean': dean_name,  # Send back the dean's full name for display
                        'employeeID': institutes.employeeID  # Include the ID for future edits
                    }
                })
            else:
                return jsonify({'error': 'Program not found'}), 404
                
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Database error occurred'}), 500

    @app.route('/api/institutes', methods=['POST'])
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

            # Validate file extension
            allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
            if '.' not in instPic.filename:
                return jsonify({'success': False, 'message': 'Invalid file format'}), 400

            file_extension = instPic.filename.rsplit('.', 1)[1].lower()
            if file_extension not in allowed_extensions:
                return jsonify({'success': False, 'message': 'Invalid file format. Only jpg and png allowed.'}), 400

            # Build Nextcloud path
            path = "UDMS_Repository/Institute_Logo"
            encoded_path = safe_path(path)
            ensure_directories(encoded_path)

            filename = f"{instCode}.{file_extension}"
            filename = secure_filename(filename)

            if not filename:
                return jsonify({'success': False, 'message': 'Invalid filename'}), 400

            # Set the filename property for upload
            instPic.filename = filename
        
            # Upload file to Nextcloud
            response = upload_to_nextcloud(instPic, encoded_path)
            if response.status_code not in (200, 201, 204):
                return jsonify({
                    'success': False,
                    'message': 'Nextcloud upload failed.',
                    'status': response.status_code,
                    'details': response.text
                }), 400

            instPicPath = f"{path}/{filename}"  

            # Handle employeeID
            final_employee_id = employee_id.strip() if employee_id and employee_id.strip() else None

            # Create new institute object
            new_institute = Institute(
                instCode=instCode,
                instName=instName,
                instPic=instPicPath,
                employeeID=final_employee_id
            )

            db.session.add(new_institute)
            db.session.commit()

            # Get dean info
            dean = new_institute.dean
            dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A"

            return jsonify({
                'success': True,
                'message': 'Institutes Created Successfully',
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
    def delete_institute(instID):
        try:
            institutes = Institute.query.filter_by(instID=instID).first()
            
            if not institutes:
                return jsonify({'error': 'Program not found'}), 404
            
            # Check dependencies before deletion
            dependencies = []
            
            # Check employees
            employees = Employee.query.filter_by(instID=instID).count()
            if employees > 0:
                dependencies.append(f"{employees} employee(s)")
            
            # Check areas
            areas = Area.query.filter_by(instID=instID).count()
            if areas > 0:
                dependencies.append(f"{areas} area(s)")
            
            # Check institutes  
            institutes = Institute.query.filter_by(instID=instID).count()
            if institutes > 0:
                dependencies.append(f"{institutes} institute(s)")
                
            # Check deadlines
            deadlines = Deadline.query.filter_by(instID=instID).count()  
            if deadlines > 0:
                dependencies.append(f"{deadlines} deadline(s)")
            
            # If dependencies exist, prevent deletion
            if dependencies:
                dependency_text = ", ".join(dependencies)
                return jsonify({
                    'error': 'Cannot delete institute',
                    'reason': f'This institute is referenced by: {dependency_text}',
                    'suggestion': 'Please reassign or remove dependent records first',
                    'canDelete': False,
                    'dependencies': dependencies
                }), 400
            
            # Safe to delete - no dependencies found
            db.session.delete(institutes)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Institute deleted successfully',
                'deletedID': instID
            })
                
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

        response = preview_from_nextcloud(institute.instPic)

        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "application/octet-stream")
            return Response(response.content, content_type=content_type)
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch logo for {instCode}",
                "status": response.status_code,
                "detail": getattr(response, "text", "No response text")
            }), response.status_code




    
                                        #PROGRAM PAGE ROUTES
    
    #edit program base on program id
    @app.route('/api/program/<int:programID>', methods=['PUT'])
    @jwt_required()
    def edit_program(programID):
        try:
            current_user_id = get_jwt_identity()
            admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
            if not admin_user or not admin_user.isAdmin:
                return jsonify({'success': False, 'message': 'Admins only'}), 403
            data = request.get_json()  # Get JSON data from frontend
            programs = Program.query.filter_by(programID=programID).first()  # Find program by ID
            
            if programs:
                # Update the database fields with new values
                programs.programCode = data.get('programCode')      # Update program code (e.g., "BSIT")
                programs.programName = data.get('programName')      # Update program name  
                programs.programColor = data.get('programColor')    # Update program color
                # Handle employeeID - accept string format like "23-45-678"
                employee_id = data.get('employeeID')
                if employee_id and employee_id.strip():  # Check if not empty
                    programs.employeeID = employee_id  # Store as string (matches your DB format)
                else:
                    programs.employeeID = None  # Set to null for empty values
                
                db.session.commit()  # Save changes to database
                
                # After saving, get the updated dean info via the foreign key relationship
                dean = programs.dean  # This uses the relationship defined in your models.py
                dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A"
                
                return jsonify({
                    'success': True,
                    'message': 'Program Updated Successfully',
                    'updated_program': {
                        'programID': programs.programID,
                        'programCode': programs.programCode,
                        'programName': programs.programName,
                        'programColor': programs.programColor,
                        'programDean': dean_name,  # Send back the dean's full name for display
                        'employeeID': programs.employeeID  # Include the ID for future edits
                    }
                })
            else:
                return jsonify({'error': 'Program not found'}), 404
                
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Database error occurred'}), 500

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
            if employee_id and employee_id.strip():  # Check if not empty
                final_employee_id = employee_id  # Store as string
            else:
                final_employee_id = None  # Set to null for empty values
            
            # Create new program object
            new_institute = Program(
                programCode=data.get('programCode'),
                programName=data.get('programName'),
                programColor=data.get('programColor'),
                employeeID=final_employee_id
            )
            
            db.session.add(new_institute)  # Add to database
            db.session.commit()  # Save changes
            
            # Get the dean info for response (same as edit route)
            dean = new_institute.dean
            dean_name = f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A"
            
            return jsonify({
                'success': True,
                'message': 'Program Created Successfully',
                'programID': new_institute.programID,
                'programCode': new_institute.programCode,
                'programName': new_institute.programName,
                'programColor': new_institute.programColor,
                'programDean': dean_name,
                'employeeID': new_institute.employeeID
            })
            
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
            
            # Check dependencies before deletion
            dependencies = []
            
            # Check employees
            employees = Employee.query.filter_by(programID=programID).count()
            if employees > 0:
                dependencies.append(f"{employees} employee(s)")
            
            # Check areas
            areas = Area.query.filter_by(programID=programID).count()
            if areas > 0:
                dependencies.append(f"{areas} area(s)")
            
            # Check institutes  
            institutes = Institute.query.filter_by(programID=programID).count()
            if institutes > 0:
                dependencies.append(f"{institutes} institute(s)")
                
            # Check deadlines
            deadlines = Deadline.query.filter_by(programID=programID).count()  
            if deadlines > 0:
                dependencies.append(f"{deadlines} deadline(s)")
            
            # If dependencies exist, prevent deletion
            if dependencies:
                dependency_text = ", ".join(dependencies)
                return jsonify({
                    'error': 'Cannot delete program',
                    'reason': f'This program is referenced by: {dependency_text}',
                    'suggestion': 'Please reassign or remove dependent records first',
                    'canDelete': False,
                    'dependencies': dependencies
                }), 400
            
            # Safe to delete - no dependencies found
            db.session.delete(programs)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Program deleted successfully',
                'deletedID': programID
            })
                
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

        if areaID is None or progress is None:
            return jsonify({'success': False, 'message': 'areaID and progress are required'}), 400
        
        area = Area.query.filter_by(areaID=areaID).first()

        area.progress = progress

        db.session.commit()

        return jsonify({'success': True, 'message': 'Area progress saved!'}), 200

    @app.route('/api/criteria', methods=["GET"])
    def get_criteria(): 

        criteria = Criteria.query.all()

        results = []

        for c in criteria:
            criteria_data ={
                'criteriaID': c.criteriaID,
                'criteriaContent': c.criteriaContent,
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
        due_date = data.get("due_date") 

        
        #creates a new deadline 
        new_deadline = Deadline(
            programID = programID,
            areaID = areaID,
            content = content,
            due_date = due_date
        )

        db.session.add(new_deadline)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Deadline created successfully!'}), 200
    

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
        


    # Accreditation page
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
                Document.docPath
            )
            .outerjoin(Program, Area.programID == Program.programID)
            .outerjoin(Subarea, Area.areaID == Subarea.areaID)
            .outerjoin(Criteria, Subarea.subareaID == Criteria.subareaID)
            .outerjoin(Document, Criteria.docID == Document.docID)       
            .order_by(Area.areaID.asc(), Subarea.subareaID.asc(), Criteria.criteriaID.asc())
            .filter(Program.programCode == program_code)
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
        db.session.commit()

        return jsonify({'message': 'Criteria created successfully!'}), 200
    
    # Load the embedding model for semantic searching
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

    @app.route('/api/accreditation/upload', methods=["POST"])
    @jwt_required()        
    def upload_file():
        current_user_id = get_jwt_identity()
        admin_user = Employee.query.filter_by(employeeID=current_user_id).first()
        if not admin_user or not admin_user.isAdmin:
            return jsonify({'success': False, 'message': 'Admins only'}), 403
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
        
        # === Validate the Data ===   
        # Check if file exists
        if not file:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        
        # Check if file has a valid name and extension
        if not file.filename or '.' not in file.filename:        
            return jsonify({'success': False, 'message': 'Invalid file name'}), 400
        
        allowed_extensions = {'pdf'}
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        
        if file_extension not in allowed_extensions:            
            return jsonify({'success': False, 'message': 'Invalid file format. Only PDF files are allowed.'}), 400                
        
        
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

            # Final commit
            db.session.commit()

            return jsonify({
                'success': True, 
                'message': 'File uploaded successfully!', 
                'filePath': f"{normalized_path}/{filename}",
                'status': response.status_code, 
            }), 200
            
        except Exception as e:
            db.session.rollback()  # Rollback on error
            return jsonify({'success': False, 'message': f'Failed to upload file: {str(e)}'}), 400
        

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

       
    # === Documents Section ===

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
    def download_file_documents(file_path):
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


    # === Rate criteria ===
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
                Document.docPath
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
        db.session.commit()
        return jsonify({'success': True, 'message': 'Area rating saved!' }), 200



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
           



        
                    
        
    
