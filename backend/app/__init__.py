from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
import os
import redis

redis_client = redis.Redis(host='redis', port=6379, db=0)

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()



def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"    
    
    #cookies settings (secure=False; secure=True in production)
    app.config['JWT_COOKIE_SECURE'] = False
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config['JWT_REFRESH_COOKIE_NAME'] = 'refresh_token'


    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, cors_allowed_origins=["http://localhost:5173"], async_mode='threading', logger=True, engineio_logger=True)
    JWTManager(app)

    CORS(app, origins=['http://localhost:5173'], supports_credentials=True)

    # Initialize SocketIO with CORS settings
    socketio.init_app(app, cors_allowed_origins="http://localhost:5173", 
                      async_mode='threading', logger=True, engineio_logger=True)

    from app.routes import register_routes
    register_routes(app)

    # Import socket handlers to register events
    from . import socket_handlers

    
    return app, socketio
    