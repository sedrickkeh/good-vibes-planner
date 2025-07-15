from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Todo schemas
class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    estimated_time: Optional[int] = None
    priority: str = "medium"
    calendar_id: Optional[str] = None
    is_recurring: Optional[bool] = False
    recurring_pattern: Optional[str] = None
    recurring_count: Optional[int] = None

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    estimated_time: Optional[int] = None
    priority: Optional[str] = None
    calendar_id: Optional[str] = None
    is_completed: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurring_pattern: Optional[str] = None
    recurring_count: Optional[int] = None

class Todo(TodoBase):
    id: str
    is_completed: bool
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Calendar schemas
class CalendarBase(BaseModel):
    name: str
    color: str
    is_default: bool = False

class CalendarCreate(CalendarBase):
    pass

class CalendarUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    is_default: Optional[bool] = None

class Calendar(CalendarBase):
    id: str

    class Config:
        from_attributes = True

# Template schemas
class TemplateBase(BaseModel):
    name: str
    title: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    estimated_time: Optional[int] = None
    priority: str = "medium"
    calendar_id: Optional[str] = None

class TemplateCreate(TemplateBase):
    pass

class Template(TemplateBase):
    id: str

    class Config:
        from_attributes = True

# Data migration schema
class MigrationData(BaseModel):
    todos: List[dict] = []
    calendars: List[dict] = []
    templates: List[dict] = [] 