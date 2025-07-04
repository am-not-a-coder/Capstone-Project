from flask import jsonify, request, session
from app.models import User
from app import db
from werkzeug.security import check_password_hash
from app.decorator import login_required

def register_routes(app):
    @app.route('/api/checkdb', methods=['GET'])
    def checkdb():
        return jsonify({'message': "The backend is working"})
    
    @app.route('/api/users', methods=['GET'])
    @login_required
    def get_users():
        users = User.query.all()
        return jsonify({'employeeID': u.employeeID, 'password': u.password} for u in users)
    
    @app.route('/api/login', methods=["POST"])
    @login_required
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
            return jsonify({'success': True, 'message': 'Login successful'})
            
        else:
            return jsonify({'success': False,'message': "Invalid password"})
        
    @app.route('/api/logout', methods=["POST"])
    def logout():
        session["isOnline"] = False
        session.clear()
        return jsonify({"message":"You have logged out the system"})
    
    
