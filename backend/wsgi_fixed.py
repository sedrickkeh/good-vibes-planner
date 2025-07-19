import os
import sys

# Add your project directory to Python path
project_home = '/home/sedrickkeh/good-vibes-planner/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables if needed
os.environ.setdefault('DATABASE_URL', 'sqlite:///./good_vibes.db')

# Import models first to register them
import models  # This ensures all models are registered with SQLAlchemy

# Import database functions
from database import create_tables, engine
from models import Base

# Initialize database tables when WSGI starts
try:
    print("WSGI: Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("WSGI: Database tables created successfully!")
    
    # List created tables for debugging
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"WSGI: Available tables: {tables}")
    
except Exception as e:
    print(f"WSGI: Error creating database tables: {e}")

# Import the FastAPI app
from main import app

# WSGI wrapper for FastAPI
class WSGIApp:
    def __init__(self, app):
        from uvicorn.middleware.wsgi import WSGIMiddleware
        self.app = WSGIMiddleware(app)
    
    def __call__(self, environ, start_response):
        return self.app(environ, start_response)

application = WSGIApp(app) 