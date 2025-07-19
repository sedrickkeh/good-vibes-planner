import os
import sys

# Add your project directory to Python path
path = '/home/sedrickkeh/good-vibes-planner/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Set environment variables if needed
os.environ.setdefault('DATABASE_URL', 'sqlite:///./good_vibes.db')

from main import app

# This is what PythonAnywhere will import
application = app 