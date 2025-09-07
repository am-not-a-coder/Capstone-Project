from flask import Flask, jsonify, request, current_app
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity, jwt_required
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from app import socketio, redis_client
from datetime import datetime
import threading



sid_to_user = {}
user_to_sid = {}
pending_broadcast_timer = None
user_activity_timers = {}


def get_online_users():
    return list(user_to_sid.keys())

def add_presence(sid, user_id):
    sid_to_user[sid] = user_id
    user_to_sid.setdefault(user_id, set()).add(sid)

def remove_presence(sid):
    user_id = sid_to_user.pop(sid, None)
    if not user_id:
        return
    sids = user_to_sid.get(user_id)
    if sids:
        sids.discard(sid)
        if not sids:
            user_to_sid.pop(user_id, None)


def broadcast_online_users():
    ids = [b.decode() for b in redis_client.smembers('online_users')]
    socketio.emit('users_online', ids, namespace='/')


def schedule_broadcast_online_users(delay_ms=150):
    global pending_broadcast_timer
    if pending_broadcast_timer and pending_broadcast_timer.is_alive():
        pending_broadcast_timer.cancel()
    pending_broadcast_timer = threading.Timer(delay_ms/1000, broadcast_online_users)
    pending_broadcast_timer.start()



@socketio.on('connect')
def on_connect():
    try:
        verify_jwt_in_request(locations=['cookies'])
        user_id = get_jwt_identity()
    except Exception:
        disconnect()
        return False

    add_presence(request.sid, user_id)
    redis_client.sadd('online_users', user_id)
    schedule_broadcast_online_users()  # This should trigger the broadcast
    join_room(f'user:{user_id}')

    user_status = redis_client.hget('user_status', user_id)
    if user_status:
        user_status = user_status.decode('utf-8')
    else:
        user_status = 'active'
    emit('status_response', {
        'userID': user_id,
        'status': user_status,
        'message': 'Connected Successfully!'
    })

@socketio.on('disconnect')
def on_disconnect():
    user_id = sid_to_user.get(request.sid)
    if request.sid and user_id:
        remove_presence(request.sid)
        # Remove from Redis when user disconnects
        redis_client.srem('online_users', user_id)
        # Broadcast the updated list
        schedule_broadcast_online_users()
        
    if user_id in user_activity_timers:
        user_activity_timers[user_id].cancel()
        del user_activity_timers[user_id]


@socketio.on('check_status')
def check_status(data=None):
    try:
        verify_jwt_in_request(locations=['cookies'])
        user_id = get_jwt_identity()
        status = redis_client.hget('user_status', user_id)
        status_str = status.decode('utf-8') if status else 'active'
        return {'user_status': status_str}
    except Exception as e:
        try:
            current_app.logger.error(f'check_status error: {e}')
        except Exception:
            pass
        return {'user_status': 'active'}



@socketio.on('status_change')
def handle_status_change(data):
    try:
        verify_jwt_in_request(locations=['cookies'])
        user_id = get_jwt_identity()
        current = redis_client.hget('user_status', user_id)
        current_str = current.decode('utf-8') if current else None
        if current_str == data:
            return {'updated': False, 'status': current_str}
        redis_client.hset('user_status', user_id, data)
        socketio.emit('broadcast', {
            'userID': user_id,
            'status': data
        }, namespace='/')
        return {'updated': True, 'status': data}
    except Exception as e:
        try:
            current_app.logger.error(f'status_change error: {e}')
        except Exception:
            pass
        return {'updated': False}

