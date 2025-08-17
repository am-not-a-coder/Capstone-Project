from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio

@socketio.on('connect')
def handle_connect(auth):
    print('someone is trying to connect.')