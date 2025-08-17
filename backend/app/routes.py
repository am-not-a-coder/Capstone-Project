from flask import jsonify, request, session, send_from_directory, current_app
from app import db
from werkzeug.security import check_password_hash, generate_password_hash, _hash_internal
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, get_jwt
from flask_jwt_extended.exceptions import JWTExtendedException
from datetime import datetime, timedelta
import os
import re
from app.models import Employee, Program, Area, Subarea, Institute, Document, Deadline, AuditLog, Announcement, Criteria


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
                
            if is_valid_password: #checks if the user input hashed password matches the hashed pass in the db 
                # After login, store the user info in the session
                
                user.isOnline = True
                db.session.commit()      
                try:
                    # Create both access token (15 minutes) and refresh token (7 days)
                    access_token = create_access_token(
                        identity=empID,
                        expires_delta=timedelta(minutes=15),  # Short-lived for security
                        additional_claims={
                            'role': 'admin' if user.isAdmin else 'user',
                            'firstName': user.fName,
                            'lastName': user.lName
                        }
                    )
                    
                    refresh_token = create_refresh_token(
                        identity=empID,
                        expires_delta=timedelta(days=7)  # Longer-lived for convenience
                    )
                    
                    # Prepare user data (without sensitive information)
                    user_data = {
                        'employeeID': user.employeeID,
                        'name': f"{user.fName} {user.lName}{user.suffix or ''}",
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
                        'message': 'Login successful',
                        'access_token': access_token,
                        'refresh_token': refresh_token,
                        'user': user_data
                    })
                except Exception as jwt_error:
                    current_app.logger.error(f"JWT Error: {jwt_error}")
                    return jsonify({'success': False, 'message': 'Token generation failed'}), 500

            else:
                return jsonify({'success': False,'message': "Invalid password"})
        except Exception as e:
            current_app.logger.error(f"Login error: {e}")
            return jsonify({'success': False, 'message': 'Internal server error'}), 500
        

        
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
        """
        Endpoint to refresh access token using refresh token

        Frontend sends request with refresh token in Authorization header
        We verify refresh token is valid and not expired
        We create new access token with same user identity
        Optionally create new refresh token for extended security
        Return new tokens to frontend
        """
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
    
    
    #LOGOUT API
    @app.route('/api/logout', methods=["POST"])
    def logout():
        session["isOnline"] = False
        session.clear()
        return jsonify({"message":"You have logged out the system"})
    

                                        #USER PAGE ROUTES

    #CREATE USER
    @app.route('/api/user', methods=["POST"])
    @jwt_required()
    def create_user():
        # get the user input 
        data = request.form
        empID = data.get("employeeID").strip()
        password = data.get("password").strip()
        first_name = data.get("fName").strip()
        last_name = data.get("lName").strip()
        suffix = data.get("suffix").strip()
        email = data.get("email").strip()
        contactNum = data.get("contactNum").strip()
        programID = data.get("programID")
        areaID = data.get("areaID")

        #email regex for validation
        validEmail = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        
        # Validate required fields
        if not password or len(password.strip()) == 0:
            return jsonify({'success': False, 'message': 'Password cannot be empty'}), 400
        if not empID:
            return jsonify({'success': False, 'message': 'Employee ID is required'}), 400
        if not first_name:
            return jsonify({'success': False, 'message': 'First name is required'}), 400
        if not last_name:
            return jsonify({'success': False, 'message': 'Last name is required' }), 400
        # Validate email format
        if not email or len(email.strip()) == 0:
            return jsonify({'success': False, 'message': 'Email is required' }), 400
        elif not re.match(validEmail, email):
            return jsonify({'success': False, 'message': 'Please enter a valid email'}), 400
        # Validate contact number format (11 digits)
        if not contactNum:
            return jsonify({'success': False, 'message': 'Contact number is required'}), 400
        elif not re.match(r'^\d{11}$', contactNum):
            return jsonify({'success': False, 'message': 'Contact number must be 11 digits'}), 400

        # Get the profile picture file
        profilePic = None
        file = request.files.get("profilePic")

        if file and file.filename:
            try:
                filename = secure_filename(file.filename)
                
                # Make sure the folder exists
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                profilePic = f"/uploads/{filename}"
            except Exception as e:
                print(f"File Upload Error: {e}")
                return jsonify({'success': False, 'message': 'Failed to upload profile picture'}), 400



        # Checks if the user already exists
        user = Employee.query.filter_by(employeeID=empID).first()
        if user:
            return jsonify({'success': False, "message": "Employee already exists"}), 400
        else:
            new_user = Employee(
                employeeID = empID,
                password = generate_password_hash(password, method="pbkdf2:sha256"),
                fName = first_name,
                lName = last_name,
                suffix = suffix,
                email = email,
                contactNum = contactNum,
                profilePic = profilePic,
                programID = programID,
                areaID = areaID
        )
            db.session.add(new_user)
            db.session.commit()
            return jsonify({'success': True, "message": "Employee created successfully"}), 201  
        

    #Reset user password (for fixing invalid password hashes)
    @app.route('/api/user/<string:employeeID>/reset-password', methods=["POST"])
    @jwt_required()
    def reset_user_password(employeeID):
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
    def delete_user(employeeID):
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
                'profilePic': user.profilePic,
                'isAdmin': user.isAdmin,
                'isOnline': user.isOnline
            } 
            user_list.append(user_data)
        return jsonify({"users" : user_list}), 200
    
    # Get the uploaded file by filename
    @app.route('/uploads/<filename>', methods=["GET"])
    def get_uploaded_file(filename):
        try:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False)
        except FileNotFoundError:
            return jsonify({'error': 'File not found'}), 404

    

                                        #PROGRAM PAGE ROUTES
    

    #edit program base on program id
    @app.route('/api/program/<int:programID>', methods=['PUT'])
    def edit_program(programID):
        try:
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
    def create_program():
        try:
            data = request.get_json()  # Get JSON data from frontend
            
            # Handle employeeID - accept string format like "23-45-678"
            employee_id = data.get('employeeID')
            if employee_id and employee_id.strip():  # Check if not empty
                final_employee_id = employee_id  # Store as string
            else:
                final_employee_id = None  # Set to null for empty values
            
            # Create new program object
            new_program = Program(
                programCode=data.get('programCode'),
                programName=data.get('programName'),
                programColor=data.get('programColor'),
                employeeID=final_employee_id
            )
            
            db.session.add(new_program)  # Add to database
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
                'employeeID': new_program.employeeID
            })
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Create program error: {str(e)}")
            return jsonify({'error': 'Failed to create program'}), 500

    #Delete program by ID
    @app.route('/api/program/<int:programID>', methods=['DELETE'])
    def delete_program(programID):
        try:
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
        

    #Get the programs
    @app.route('/api/program', methods=["GET"])
    def get_program():
        programs = Program.query.all()
                    
        program_list = []

        for program in programs:

            dean = program.dean

            program_data = {
                'programID': program.programID,
                'programDean': f"{dean.fName} {dean.lName} {dean.suffix or ''}" if dean else "N/A",
                'programCode': program.programCode,
                'programName': program.programName,
                'programColor': program.programColor,
                'employeeID': program.employeeID  # Include the foreign key ID
            } 
            program_list.append(program_data)
        return jsonify({"programs": program_list}), 200


    #Get the area
    @app.route('/api/area', methods=["GET"])
    def get_area():
        areas = Area.query.all()
        area_list = []
        for area in areas:
            areas = (Area.query
                .join(Program, Area.programID == Program.programID)
                .outerjoin(Subarea, Area.subareaID == Subarea.subareaID)
                .add_columns(
                    Area.areaID,
                    Area.programID if Area.programID is not None else "",
                    Area.subareaID if Area.subareaID is not None else "",
                    Program.programCode if Program.programCode is not None else "",
                    Area.areaName if Area.areaName is not None else "",
                    Area.areaNum if Area.areaNum is not None else "",
                    Area.progress if Area.progress is not None else "",
                    Subarea.subareaName if Subarea.subareaName is not None else ""
                )
            ).all()
            area_list = []
        for area in areas:
            area_data = {
                'areaID' : area.areaID,
                'programID': area.programID,
                'subareaID': area.subareaID,
                'areaName': area.areaName,
                'programCode': area.programCode,
                'areaName': f"{area.areaNum}: {area.areaName}",
                'progress': area.progress,
                'areaNum': area.areaNum
            }
            area_list.append(area_data)
        return jsonify({"areas": area_list}), 200

    # Get the subareas
    @app.route('/api/subarea', methods=["GET"])
    def get_subarea():
        subareas = (Subarea.query
            .join(Area, Subarea.areaID == Area.areaID)
            .add_columns(
                Subarea.subareaID,
                Subarea.subareaName if Subarea.subareaName is not None else "",
                Subarea.areaID
            )
        ).all()

        subarea_list= []
    
        for subarea in subareas:
            subarea_data = {
                'subareaID': subarea.subareaID,
                'subareaName': subarea.subareaName,
                'areaID': subarea.areaID
            }
            subarea_list.append(subarea_data)
        return jsonify({"subareas": subarea_list}), 200

    # Get the Criterias
    @app.route('/api/criteria', methods=["GET"])
    def get_criteria():
        criterias = (Criteria.query
            .join(Subarea, Criteria.subareaID == Subarea.subareaID)
            .add_columns(
                Criteria.criteriaID,
                Criteria.subareaID,
                Criteria.criteriaContent if Criteria.criteriaContent is not None else "",
                Criteria.criteriaType if Criteria.criteriaType is not None else "",
                Criteria.docID if Criteria.docID is not None else ""
            )
        ).all()

        criteria_list = []

        for criteria in criterias:
            criteria_data = {
                'criteriaID': criteria.criteriaID,
                'criteriaContent': criteria.criteriaContent,
                'criteriaType': criteria.criteriaType,
                'docID': criteria.docID,
                'subareaID': criteria.subareaID
            }
            criteria_list.append(criteria_data)
        return jsonify({"criterias": criteria_list}), 200
            

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
        program_code = request.args.get('programCode', "BSIT")

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
                Document.docID,
                Document.docName,
                Document.docType,
                Document.docPath
            )
            .outerjoin(Program, Area.programID == Program.programID)
            .outerjoin(Subarea, Area.areaID == Subarea.areaID)
            .outerjoin(Criteria, Subarea.subareaID == Criteria.subareaID)
            .outerjoin(Document, Criteria.docID == Document.docID)       
            .order_by(Area.areaID.asc(), Subarea.subareaID.asc())
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
                    'docPath': row.docPath
                }

            match row.criteriaType:
                case "Input/s":
                    result[area_id]['subareas'][subarea_id]['criteria']['inputs'].append(criteria_data)
                case "Processes":
                    result[area_id]['subareas'][subarea_id]['criteria']['processes'].append(criteria_data)
                case "Outcomes":
                    result[area_id]['subareas'][subarea_id]['criteria']['outcomes'].append(criteria_data)

        for area in result.values():
            area['subareas'] = list(area['subareas'].values())


        return jsonify(list(result.values())) 
    

    @app.route('/api/subarea', methods=["GET"])
    def get_subarea():
        # Query all subareas with their criteria
        results = (
            db.session.query(
                Subarea.subareaID,
                Subarea.subareaName,
                Area.areaID,
                Criteria.criteriaID
            )
            .join(Area, Subarea.areaID == Area.areaID)
            .outerjoin(Criteria, Subarea.subareaID == Criteria.subareaID)
            .all()
        )

        subarea_dict = {}

        for sa in results:
            if sa.subareaID not in subarea_dict:
                subarea_dict[sa.subareaID] = {
                    'subareaID': sa.subareaID,
                    'subareaName': sa.subareaName,
                    'areaID': sa.areaID,
                    'criteria': []  # group criteria here
                }
            if sa.criteriaID:
                subarea_dict[sa.subareaID]['criteria'].append({
                    'criteriaID': sa.criteriaID
                })

        return jsonify({'subarea': list(subarea_dict.values())}), 200

    @app.route('/api/accreditation/create_area', methods=["POST"])
    def create_area():
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
    def create_sub_area():
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
    def create_criteria():
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


    @app.route('/api/accreditation/upload', methods=["POST"])
    @jwt_required()
    def upload_file():
       # ==== Get and Validate Form Data ====
        # Get form data
        file = request.files.get("uploadedFile")
        file_type = request.form.get("fileType")
        file_name = request.form.get("fileName")
        criteria_id = request.form.get("criteriaID")
        
    
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
        # Generate secure filename
        filename = secure_filename(file.filename)

        
        if not filename:
            return jsonify({'success': False, 'message': 'Invalid filename'}), 400
        
        try:
            # Create upload directory
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            
            # Save file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            print("Saving file to:", file_path)
            file.save(file_path)
            
            file_url = f"/uploads/{filename}"
            
            # ==== Create document record ====

            # Create database record
            new_document = Document(
                docName=file_name,
                docType=file_type,
                docPath=file_url,
                employeeID=uploader.employeeID  
            )
            
            db.session.add(new_document)
            db.session.flush() # Get the docID after adding to session

            # ==== Link document to criteria ====
            criteria = Criteria.query.get(criteria_id)

            if not criteria:
                db.session.rollback()
                return jsonify({'success': False, 'message': 'Criteria not found'}), 404
            
            criteria.docID = new_document.docID  # Link document to criteria

            db.session.commit()
            
            return jsonify({
                'success': True, 
                'message': 'File uploaded successfully!', 
                'filePath': file_url
            }), 200
            
        except Exception as e:
            db.session.rollback()  # Rollback on error
            return jsonify({'success': False, 'message': f'Failed to upload file: {str(e)}'}), 400
        


    @app.route('/api/accreditation/preview/<filename>')   
    def preview_file(filename):   
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

            
           



        
                    
        

    
