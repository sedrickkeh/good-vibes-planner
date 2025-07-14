from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./good_vibes.db"

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
        
# Initialize database
def init_db():
    create_tables()
    
    # Insert default projects if none exist
    db = SessionLocal()
    try:
        from models import Project
        if not db.query(Project).first():
            default_projects = [
                Project(id='personal', name='Personal', color='#3b82f6'),
                Project(id='work', name='Work', color='#10b981'),
                Project(id='health', name='Health', color='#f59e0b'),
            ]
            db.add_all(default_projects)
            db.commit()
    finally:
        db.close() 