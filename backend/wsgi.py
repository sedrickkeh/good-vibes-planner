import os
import sys

# Add your project directory to Python path
path = '/home/sedrickkeh/good-vibes-planner/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Set environment variables if needed
os.environ.setdefault('DATABASE_URL', 'sqlite:////home/sedrickkeh/good-vibes-planner/backend/good_vibes.db')

# Manual initialization since WSGI doesn't support FastAPI lifespan events
try:
    print("WSGI: Initializing database and users...")
    
    # Import and create all tables
    from database import init_db
    init_db()
    print("WSGI: Database tables created successfully!")
    
    # Create admin user with default data
    from auth import ensure_admin_user
    ensure_admin_user()
    print("WSGI: Admin user and default data initialized!")
    
except Exception as e:
    print(f"WSGI: Error during initialization: {e}")
    import traceback
    traceback.print_exc()

from main import app

# WSGI wrapper for FastAPI
class WSGIApp:
    def __init__(self, app):
        from uvicorn.middleware.wsgi import WSGIMiddleware
        self.app = WSGIMiddleware(app)
    
    def __call__(self, environ, start_response):
        return self.app(environ, start_response)

application = WSGIApp(app) 