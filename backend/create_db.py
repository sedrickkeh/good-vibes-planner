#!/usr/bin/env python3
"""
Standalone script to create database tables on PythonAnywhere
Run this script once to initialize your database.
"""

import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import create_tables, engine
from models import Base
import models  # Import all models to ensure they're registered

def main():
    print("Creating database tables...")
    
    # Show current working directory
    print(f"Current directory: {os.getcwd()}")
    
    # Show database URL
    from config import settings
    print(f"Database URL: {settings.DATABASE_URL}")
    
    # Create all tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📋 Created tables: {tables}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 