from flask import jsonify, request, session
from app.models import User
from app import db
from werkzeug.security import check_password_hash

from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required


def register_routes(app):
    # CHECKS IF THE BACKEND IS WORKING
    @app.route('/api/checkdb', methods=['GET'])
    def checkdb():
        return jsonify({'message': "The backend is working"})
    
    #LOGIN API
    @app.route('/api/login', methods=["POST"])
    def login():
        #Get the JSON from the request
        data = request.get_json()
        empID = data.get("employeeID")
        password = data.get("password")
        #Fetches the user from the db using the employeeID
        user = User.query.filter_by(employeeID=empID).first()
        #If the user is not found
        if user is None:
            return jsonify({'success': False, 'message': 'User not found'})
        
        elif check_password_hash(user.password, password): #checks if the user input hashed password matches the hashed pass in the db 
            # After login, store the user info in the session
            session["employeeID"] = user.employeeID
            session["name"] = str(user.fName) + str(user.lName) + str(user.suffix)
            session["email"] = user.email
            session["contactNum"] = user.contactNum
            session["profilePic"] = user.profilePic
            session["isAdmin"] = user.isAdmin
            session["isOnline"] = user.isOnline
            user.isOnline = True
            db.session.commit()      
            access_token = create_access_token(identity=empID)      
            return jsonify({'success': True, 'message': 'Login successful', 'access_token': access_token})        
        else:
            return jsonify({'success': False,'message': "Invalid password"})
        
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
    

    
