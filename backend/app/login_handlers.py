from app import db, redis_client
from flask import jsonify, current_app
from flask_jwt_extended import set_access_cookies, set_refresh_cookies
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token, create_refresh_token
import uuid
import json


def complete_user_login(user, empID, set_otp_verified=False):
    user.isOnline = True
    if set_otp_verified:
        user.otpverified = True
    db.session.commit()
    # Store in Redis for real-time features (optional)
    redis_client.sadd('online_users', empID)
    redis_client.hset('user_status', empID, 'active')
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
            expires_delta=timedelta(days=7)
        )
        # Create a Redis-backed session (24 hours TTL)
        session_id = str(uuid.uuid4())
        session_payload = {
            'employeeID': user.employeeID,
            'isAdmin': bool(user.isAdmin),
            'firstName': user.fName,
            'lastName': user.lName,
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }
        redis_client.setex(f'session:{session_id}', 24 * 60 * 60, json.dumps(session_payload))

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
        # Warm user profile cache for faster subsequent loads
        try:
            redis_client.setex(f'user_profile:{empID}', 300, json.dumps(user_data))
        except Exception as cache_err:
            current_app.logger.error(f'Failed to cache user profile: {cache_err}')
        
        resp = jsonify({
            'success': True,
            'message': f"Welcome!, {user_data['lastName']}",
            'user': user_data,
            'session_id': session_id
        })
        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)
        try:
            resp.set_cookie(
                'session_id', session_id,
                max_age=24 * 60 * 60,
                httponly=True,
                samesite='Lax',
                secure=False
            )
        except Exception as cookie_err:
            current_app.logger.error(f'Failed to set session cookie: {cookie_err}')
        return resp
    except Exception as jwt_error:
        current_app.logger.error(f"JWT Error: {jwt_error}")
        return jsonify({'success': False, 'message': 'Token generation failed'}), 500
