from flask import jsonify, request, session, send_from_directory, current_app
from app import db
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_jwt_extended.exceptions import JWTExtendedException
from datetime import datetime
import os
from app.models import Employee, Program, Area, Subarea, Institute, Document, Deadline, AuditLog, Announcement, Criteria


def register_routes(app):
                                        #AUTHENTICATION(LOGIN/LOGOUT) PAGE ROUTES 


    # CHECKS IF THE BACKEND IS WORKING
    @app.route('/api/checkdb', methods=['GET'])
    def checkdb():
        return jsonify({'message': "The backend is working"})
    
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
            
            if check_password_hash(user.password, password): #checks if the user input hashed password matches the hashed pass in the db 
                # After login, store the user info in the session
                
                user.isOnline = True
                db.session.commit()      
                try:
                    access_token = create_access_token(identity=empID)
                    return jsonify({'success': True, 'message': 'Login successful', 'access_token': access_token})
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
        empID = data.get("employeeID")
        password = data.get("password")
        first_name = data.get("fName").strip()
        last_name = data.get("lName").strip()
        suffix = data.get("suffix").strip()
        email = data.get("email").strip()
        contactNum = data.get("contactNum")
        programID = data.get("programID")
        areaID = data.get("areaID")

        # Get the profile picture file
        file = request.files.get("profilePic")

        if file:

            filename = secure_filename(file.filename)
            
            # Make sure the folder exists
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            profilePic = f"/uploads/{filename}"
        else:
            profilePic = None


        # Checks if the user already exists
        user = Employee.query.filter_by(employeeID=empID).first()
        if user:
            return jsonify({'success': False, "message": "Employee already exists"}), 400
        else:
            new_user = Employee(
                employeeID = empID,
                password = generate_password_hash(password),
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
        


    #Delete the user 
    @app.route('/api/user/<string:employeeID>', methods=["DELETE"])
    def delete_user(employeeID):
        user = Employee.query.filter_by(employeeID=employeeID).first()

        if not user:
            return jsonify({"success": False, "message": "Employee does not exists"}), 404
        
        db.session.delete(user)
        db.session.commit()

        return jsonify({"success": True, "message":"Employee has been deleted"}), 200



                                        #DATA FETCHING ROUTES
                                        
                                                            
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
    

    
    #Get the programs
    @app.route('/api/program', methods=["GET"])
    def get_program():
        programs = Program.query.all()
                    
        program_list = []

        for program in programs:

            dean = program.dean

            program_data = {
                'programID': program.programID,
                'programDean': f"{dean.lName} {dean.fName} {dean.suffix or ''}" if dean else "N/A",
                'programCode': program.programCode,
                'programName': program.programName,
                'programColor': program.programColor,
            } 
            program_list.append(program_data)
        return jsonify({"programs": program_list}), 200

    #Get the areas
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
                'progress': area.progress,
                'subareaName': area.subareaName,
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
        







        
                    
        

    
