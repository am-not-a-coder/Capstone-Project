from app import db, redis_client
from flask import jsonify, current_app
from flask_jwt_extended import set_access_cookies, set_refresh_cookies
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token, create_refresh_token
import uuid
import json
from app.models import Program, EmployeeProgram


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
        
        # Pre-warm program caches for institutes tied to user's programs (if any)
        try:
            program_ids = [ep.programID for ep in EmployeeProgram.query.filter_by(employeeID=empID).all()]
            if program_ids:
                inst_ids = set([p.instID for p in Program.query.filter(Program.programID.in_(program_ids)).all() if p.instID])
                for inst_id in inst_ids:
                    key = f'programs:inst:{inst_id}'
                    if not redis_client.exists(key):
                        progs = Program.query.filter_by(instID=inst_id).all()
                        payload = [{
                            'programID': pr.programID,
                            'programCode': pr.programCode,
                            'programName': pr.programName,
                        } for pr in progs]
                        # Programs rarely change; cache longer (30 minutes)
                        redis_client.setex(key, 1800, json.dumps(payload))
            # Also pre-warm user's program list cache for 60s
            try:
                from app.models import Employee
                current_user = Employee.query.filter_by(employeeID=empID).first()
                if current_user:
                    is_admin = current_user.isAdmin
                    has_program_crud = current_user.crudProgramEnable
                    if is_admin or has_program_crud:
                        progs = Program.query.all()
                        access_level = 'full'
                    else:
                        if program_ids:
                            progs = Program.query.filter(Program.programID.in_(program_ids)).all()
                        else:
                            progs = []
                        access_level = 'assigned'
                    program_list = [{
                        'programID': p.programID,
                        'programDean': f"{p.dean.fName} {p.dean.lName} {p.dean.suffix or ''}" if p.dean else "N/A",
                        'programCode': p.programCode,
                        'programName': p.programName,
                        'programColor': p.programColor,
                        'employeeID': p.employeeID,
                        'instID': p.instID,
                        'instituteName': p.institute.instName if p.institute else "N/A",
                        'instituteCode': p.institute.instCode if p.institute else "N/A"
                    } for p in progs]
                    payload = {
                        'programs': program_list,
                        'accessLevel': access_level,
                        'userPermissions': {
                            'isAdmin': is_admin,
                            'isCoAdmin': current_user.isCoAdmin,
                            'crudProgramEnable': has_program_crud,
                            'assignedProgramCount': len(current_user.employee_programs)
                        }
                    }
                    redis_client.setex(f'programs:user:{empID}', 60, json.dumps(payload))
            except Exception as warm_user_err:
                current_app.logger.error(f'Failed to pre-warm user programs cache: {warm_user_err}')
        except Exception as warm_err:
            current_app.logger.error(f'Failed to pre-warm program cache: {warm_err}')
        return resp
    except Exception as jwt_error:
        current_app.logger.error(f"JWT Error: {jwt_error}")
        return jsonify({'success': False, 'message': 'Token generation failed'}), 500
