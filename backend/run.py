from app import create_app
from app.utils.retag_documents import retag_documents

app, socketio = create_app()

if __name__ == "__main__":
    # with app.app_context():
    #     retag_documents()
        
    socketio.run(
        app,
        host="0.0.0.0", 
        port=5000, 
        debug=True,
        allow_unsafe_werkzeug=True  # For development only
    )