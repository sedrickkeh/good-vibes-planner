from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # User isolation
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(String, nullable=True)  # Store as ISO date string
    end_date = Column(String, nullable=True)    # Store as ISO date string
    estimated_time = Column(Integer, nullable=True)  # Minutes
    priority = Column(String, default="medium")  # low, medium, high
    calendar_id = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurring_pattern = Column(String, nullable=True)  # daily, weekly, monthly
    recurring_count = Column(Integer, nullable=True)

class Calendar(Base):
    __tablename__ = "calendars"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # User isolation
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # User isolation
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    estimated_time = Column(Integer, nullable=True)
    priority = Column(String, default="medium")
    calendar_id = Column(String, nullable=True) 