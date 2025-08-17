from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token, get_jwt_identity
from flask import current_app, request
from app import socketio
from datetime import datetime
import logging

# Store connected users (in production, use Redis or database)
connected_users = {}

@socketio.on('connect')
def handle_connect(auth):
    """Handle client connection"""
    try:
        # Get token from auth
        token = auth.get('token') if auth else None
        
        if not token:
            current_app.logger.error("No token provided")
            disconnect()
            return False
            
        # Decode JWT token
        try:
            decoded_token = decode_token(token)
            user_identity = decoded_token['sub']  # This should be employeeID
            
            # Store user connection
            connected_users[user_identity] = {
                'session_id': request.sid,
                'employeeID': user_identity,
                'connected_at': datetime.now()
            }
            
            current_app.logger.info(f"✅ User {user_identity} connected")
            
            # Send welcome message to user
            emit('connected', {
                'message': f'Welcome! You are connected as {user_identity}',
                'user_id': user_identity
            })
            
            # Notify all users about online users
            online_users = list(connected_users.keys())
            emit('users_online', online_users, broadcast=True)
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Token decode error: {e}")
            disconnect()
            return False
            
    except Exception as e:
        current_app.logger.error(f"Connection error: {e}")
        disconnect()
        return False

@socketio.on('disconnect')
def handle_disconnect(*args):
    """Handle client disconnection"""
    try:
        # Find and remove user from connected_users
        user_to_remove = None
        for user_id, user_data in connected_users.items():
            if user_data['session_id'] == request.sid:
                user_to_remove = user_id
                break
        
        if user_to_remove:
            del connected_users[user_to_remove]
            current_app.logger.info(f"❌ User {user_to_remove} disconnected")
            
            # Update online users list
            online_users = list(connected_users.keys())
            emit('users_online', online_users, broadcast=True)
    
    except Exception as e:
        current_app.logger.error(f"Disconnect error: {e}")

@socketio.on('send_message')
def handle_message(data):
    """Handle incoming messages"""
    try:
        current_app.logger.info(f"📨 Received message: {data}")
        
        # Get current user info
        user_id = None
        for uid, user_data in connected_users.items():
            if user_data['session_id'] == request.sid:
                user_id = uid
                break
        
        if not user_id:
            current_app.logger.error("User not found in connected users")
            return
        
        conversation_id = data.get('conversationId')
        if not conversation_id:
            current_app.logger.error("No conversation ID provided")
            return
            
        # Import models here to avoid circular imports
        from app.models import ConversationParticipant
        from app import db
        
        # Get all participants in this conversation
        participants = db.session.query(ConversationParticipant.employeeID).filter(
            ConversationParticipant.conversationID == conversation_id,
            ConversationParticipant.isActive == True
        ).all()
        
        participant_ids = [p[0] for p in participants]
        current_app.logger.info(f"💬 Conversation {conversation_id} participants: {participant_ids}")
        
        # Debug connected users
        current_app.logger.info(f"🔍 Connected users: {list(connected_users.keys())}")
        for uid, user_data in connected_users.items():
            current_app.logger.info(f"  - {uid}: session {user_data['session_id']}")
        
        # Prepare message data
        message_response = {
            'text': data.get('text', ''),
            'user': data.get('user', 'Unknown'),
            'employeeID': data.get('employeeID', user_id),
            'timestamp': data.get('timestamp'),
            'room': str(conversation_id),
            'conversationId': conversation_id
        }
        
        current_app.logger.info(f"📤 Sending message to conversation participants: {message_response}")
        
        # Send message only to participants who are currently connected
        for participant_id in participant_ids:
            if participant_id in connected_users:
                participant_session = connected_users[participant_id]['session_id']
                emit('receive_message', message_response, room=participant_session)
                current_app.logger.info(f"✅ Sent to {participant_id} (session: {participant_session})")
            else:
                current_app.logger.info(f"⚠️ Participant {participant_id} not online - not in connected_users")
        
    except Exception as e:
        current_app.logger.error(f"Message handling error: {e}")
        emit('error', {'message': 'Failed to send message'})

@socketio.on('join_room')
def handle_join_room(data):
    """Handle user joining a room"""
    try:
        room = data.get('room')
        user_name = data.get('user', 'Unknown')
        
        join_room(room)
        current_app.logger.info(f"👥 {user_name} joined room {room}")
        
        emit('user_joined_room', {
            'user': user_name,
            'room': room,
            'message': f'{user_name} joined the room'
        }, room=room)
        
    except Exception as e:
        current_app.logger.error(f"Join room error: {e}")

@socketio.on('leave_room')
def handle_leave_room(data):
    """Handle user leaving a room"""
    try:
        room = data.get('room')
        user_name = data.get('user', 'Unknown')
        
        leave_room(room)
        current_app.logger.info(f"👋 {user_name} left room {room}")
        
        emit('user_left_room', {
            'user': user_name,
            'room': room,
            'message': f'{user_name} left the room'
        }, room=room)
        
    except Exception as e:
        current_app.logger.error(f"Leave room error: {e}")

@socketio.on('typing_start')
def handle_typing_start(data):
    """Handle typing indicator start"""
    try:
        room = data.get('room', 'general')
        user_name = data.get('user', 'Unknown')
        
        # Send to everyone in room except sender
        emit('user_typing', {
            'user': user_name,
            'room': room,
            'typing': True
        }, room=room, include_self=False)
        
    except Exception as e:
        current_app.logger.error(f"Typing start error: {e}")

@socketio.on('typing_stop')
def handle_typing_stop(data):
    """Handle typing indicator stop"""
    try:
        room = data.get('room', 'general')
        user_name = data.get('user', 'Unknown')
        
        # Send to everyone in room except sender
        emit('user_typing', {
            'user': user_name,
            'room': room,
            'typing': False
        }, room=room, include_self=False)
        
    except Exception as e:
        current_app.logger.error(f"Typing stop error: {e}")

# Error handling
@socketio.on_error()
def error_handler(e):
    current_app.logger.error(f"SocketIO Error: {e}")
    emit('error', {'message': 'Something went wrong'})