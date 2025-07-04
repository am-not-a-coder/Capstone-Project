from functools import wraps
from flask import session, jsonify, redirect, url_for

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'employeeID' not in session:
            #If the user is not logged in, go back to the login page
            redirect(url_for('login')) 
            jsonify({'success': False, 'message': 'You need to login first'}), 401
        return f(*args, **kwargs)
    return wrapper
            
                      

