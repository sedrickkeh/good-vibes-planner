"""
WSGI config for PythonAnywhere deployment.
This file is used by PythonAnywhere to serve the FastAPI application.
"""

import sys
import os

# Add your project directory to the Python path
project_home = '/home/yourusername/good-vibes-planner/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set up environment variables
os.environ.setdefault('SECRET_KEY', 'your-secret-key-change-this-in-production-make-it-long-and-random')
os.environ.setdefault('ALGORITHM', 'HS256')
os.environ.setdefault('ACCESS_TOKEN_EXPIRE_MINUTES', '30')

# Import your FastAPI app
from main import app

# This is what PythonAnywhere will use
application = app 