from flask import jsonify, request, session
from app.models import User
from app import db
from werkzeug.security import check_password_hash

def register_routes(app):
    @app.route('/api/ping', methods=['GET'])
    def ping():
        return jsonify({'message': "The backend is working"})
    
    @app.route('/api/users', methods=['GET'])
    def get_users():
        users = User.query.all()
        return jsonify({'employeeID': u.employeeID, 'password': u.password} for u in users)
    
    @app.route('/api/login', methods=["POST"])
    def login():
        data = request.get_json()
        empID = data["employeeID"]
        password = data["password"]
        user = User.query.filter_by(employeeID=empID).first()

        if user is None:
            return jsonify({'message': 'User not found'})
        
        elif check_password_hash(user.password, password): #checks if the user input hashed password matches the hashed pass in the db 
            session["employeeID"] = user.employeeID
            session["name"] = user.fName + user.lName + user.suffix
            session["email"] = user.email
            session["contactNum"] = user.contactNum
            session["profilePic"] = user.profilePic
            session["isAdmin"] = user.isAdmin
            session["isOnline"] = user.isOnline
            user.isOnline = True
            db.session.commit()
            return jsonify({'success': True, 'message': 'The password matched'})
            
        else:
            return jsonify({'success': False, 'message': "The password didn't matched"})
        
    @app.route('/api/logout', methods=["POST"])
    def logout():
        isOnline = False
        session.clear()
        return jsonify({"message":"You have logged out the system"})