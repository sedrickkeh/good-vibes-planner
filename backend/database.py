from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Calendar as CalendarModel
from config import settings
import time

# Database URL from configuration
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Required for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize default calendars for a new user
def init_user_data(username: str):
    db = SessionLocal()
    try:
        # Check if user already has calendars
        existing_calendars = db.query(CalendarModel).filter(CalendarModel.user_id == username).count()
        
        if existing_calendars == 0:
            # Create default calendars
            default_calendars = [
                {"name": "Personal", "color": "#3B82F6", "is_default": True},
                {"name": "Work", "color": "#10B981", "is_default": False},
                {"name": "Health", "color": "#F59E0B", "is_default": False},
            ]
            
            for cal_data in default_calendars:
                calendar = CalendarModel(
                    id=str(int(time.time() * 1000)),
                    user_id=username,
                    name=cal_data["name"],
                    color=cal_data["color"],
                    is_default=cal_data["is_default"]
                )
                db.add(calendar)
                # Small delay to ensure unique timestamps
                time.sleep(0.001)
            
            db.commit()
    finally:
        db.close()
        
# Initialize database
def init_db():
    create_tables() 