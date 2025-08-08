from flask import jsonify, request, session, send_from_directory, current_app
from app.models import Employee
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

        return jsonify({"success": True, "message":"Employee has been deleted successfully!"}), 200



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
    

    
    #Get the program
    @app.route('/api/program', methods=["GET"])
    def get_program():
        programs = Program.query.all()
                    
        program_list = []

        for program in programs:

            dean = program.dean

            program_data = {
                'programID': program.programID,
                'programDean': f"{program.lName} {program.fName} {program.suffix or ''}" if dean else "N/A",
                'programCode': program.programCode,
                'programName': program.programName,
                'programColor': program.programColor,
            } 
            program_list.append(program_data)
        return jsonify({"programs": program_list}), 200

    #Get the area for displaying in tasks
    @app.route('/api/area', methods=["GET"])
    def get_area():
        areas = (Area.query
                 .join(Program, Area.programID == Program.programID)
                 .join(Subarea, Area.subareaID == Subarea.subareaID)
                 .add_columns(
                    Area.areaID,
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
                'programCode': area.programCode,
                'areaName': area.areaName,
                'progress': area.progress,
                'subareaName': area.subareaName,
                'areaNum': area.areaNum
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
        data = (
            db.session.query(
                Area.areaID,
                Program.programCode,
                Area.areaName,
                Area.areaNum,
                Area.progress,
                Subarea.subareaID,
                Subarea.subareaName,
                Criteria.criteriaContent,
                Criteria.criteriaType,
                Document.docID,
                Document.docName,
                Document.docPath
            )
            .join(Program, Area.programID == Program.programID)
            .join(Subarea, Area.subareaID == Subarea.subareaID)
            .join(Criteria, Subarea.criteriaID == Criteria.criteriaID)
            .join(Document, Criteria.docID == Document.docID)       
            .order_by(Area.areaID)
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
                'subareas': []                  
            }
                

            if subarea_id not in result[area_id]['subareas']:
                result[area_id][subarea_id]["subareas"] = {
                    'subareaID': row.subareaID,
                    'subareaName': row.subareaName,
                    'criteria': {
                        'inputs': [],
                        'processes': [],
                        'outcomes': [],
                }, 
            }
                
            criteria_data = {
                'content': row.criteriaContent,
                'docID': row.docID,
                'docName': row.docName,
                'docPath': row.docPath
            }

            match row.criteriaType:
                case "Input":
                    result[area_id]['subareas'][subarea_id]['criteria']['inputs'].append(criteria_data)
                case "Processes":
                    result[area_id]['subareas'][subarea_id]['criteria']['processes'].append(criteria_data)
                case "Outcomes":
                    result[area_id]['subareas'][subarea_id]['criteria']['outcomes'].append(criteria_data)

        for area in result.values():
            area['subareas'] = list(area['subareas'].values())


        return jsonify(list(result.values())) 


    @app.route('/api/accreditation/upload', methods=["POST"])
    def upload_file():
        file = request.files.get("uploadFile")

        if file:

            fileName = secure_filename(file.filename)
            
            # Make sure the folder exists
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

            file_path = os.path.join(app.config['UPLOAD_FOLDER'], fileName)
            file.save(file_path)
            return {"file_url": f"/preview/{fileName}"}

    
    @app.route('/api/preview/<filename>')   
    def preview_file(filename):   
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

            
           



        
                    
        

    
