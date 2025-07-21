from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List
import time
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from pydantic import BaseModel

from database import get_db, init_db
from models import Todo as TodoModel, Calendar as CalendarModel, Template as TemplateModel
from schemas import (
    Todo, TodoCreate, TodoUpdate,
    Calendar, CalendarCreate, CalendarUpdate,
    Template, TemplateCreate,
    MigrationData
)
from auth import (
    authenticate_user, create_access_token, get_current_user, create_user,
    Token, User, UserCreate, ACCESS_TOKEN_EXPIRE_MINUTES
)
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    # Ensure admin user exists with default data
    from auth import ensure_admin_user
    ensure_admin_user()
    yield
    # Shutdown (if needed)

app = FastAPI(title="Good Vibes API", version="1.0.0", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def read_root():
    return {"message": "Good Vibes API is running!"}

# Authentication endpoints
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/token", response_model=Token)
async def login_for_access_token(login_data: LoginRequest):
    user = authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/register", response_model=User)
async def register_user(user_data: UserCreate):
    return create_user(user_data)

# ================= TODO ENDPOINTS =================

@app.get("/api/todos", response_model=List[Todo])
def get_todos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TodoModel).filter(TodoModel.user_id == current_user.username).all()

@app.post("/api/todos", response_model=Todo)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Generate ID using timestamp (matching frontend behavior)
    todo_id = str(int(time.time() * 1000))
    
    db_todo = TodoModel(
        id=todo_id,
        user_id=current_user.username,
        title=todo.title,
        description=todo.description,
        start_date=todo.start_date,
        end_date=todo.end_date,
        estimated_time=todo.estimated_time,
        priority=todo.priority,
        calendar_id=todo.calendar_id,
        is_completed=False,
        created_at=datetime.utcnow(),
        is_recurring=todo.is_recurring,
        recurring_pattern=todo.recurring_pattern,
        recurring_count=todo.recurring_count
    )
    
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.get("/api/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id, TodoModel.user_id == current_user.username).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/api/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: str, todo_update: TodoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id, TodoModel.user_id == current_user.username).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Update fields if provided
    for field, value in todo_update.dict(exclude_unset=True).items():
        if field == "is_completed" and value and not todo.is_completed:
            # Mark as completed
            setattr(todo, "completed_at", datetime.utcnow())
        elif field == "is_completed" and not value:
            # Mark as not completed
            setattr(todo, "completed_at", None)
        
        setattr(todo, field, value)
    
    db.commit()
    db.refresh(todo)
    return todo

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id, TodoModel.user_id == current_user.username).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted successfully"}

# ================= CALENDAR ENDPOINTS =================

@app.get("/api/calendars", response_model=List[Calendar])
def get_calendars(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CalendarModel).filter(CalendarModel.user_id == current_user.username).all()

@app.post("/api/calendars", response_model=Calendar)
def create_calendar(calendar: CalendarCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Generate ID using timestamp
    calendar_id = str(int(time.time() * 1000))
    
    # Check if this will be the first calendar for this user (make it default)
    is_first_calendar = db.query(CalendarModel).filter(CalendarModel.user_id == current_user.username).count() == 0
    
    db_calendar = CalendarModel(
        id=calendar_id,
        user_id=current_user.username,
        name=calendar.name,
        color=calendar.color,
        is_default=is_first_calendar or calendar.is_default
    )
    
    db.add(db_calendar)
    db.commit()
    db.refresh(db_calendar)
    return db_calendar

@app.put("/api/calendars/{calendar_id}", response_model=Calendar)
def update_calendar(calendar_id: str, calendar_update: CalendarUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    calendar = db.query(CalendarModel).filter(CalendarModel.id == calendar_id, CalendarModel.user_id == current_user.username).first()
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    for field, value in calendar_update.dict(exclude_unset=True).items():
        setattr(calendar, field, value)
    
    db.commit()
    db.refresh(calendar)
    return calendar

@app.delete("/api/calendars/{calendar_id}")
def delete_calendar(calendar_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    calendar = db.query(CalendarModel).filter(CalendarModel.id == calendar_id, CalendarModel.user_id == current_user.username).first()
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    # Delete associated todos (only for this user)
    db.query(TodoModel).filter(TodoModel.calendar_id == calendar_id, TodoModel.user_id == current_user.username).delete()
    
    db.delete(calendar)
    db.commit()
    return {"message": "Calendar and associated todos deleted successfully"}

# ================= TEMPLATE ENDPOINTS =================

@app.get("/api/templates", response_model=List[Template])
def get_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TemplateModel).filter(TemplateModel.user_id == current_user.username).all()

@app.post("/api/templates", response_model=Template)
def create_template(template: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template_id = str(int(time.time() * 1000))
    
    db_template = TemplateModel(
        id=template_id,
        user_id=current_user.username,
        name=template.name,
        title=template.title,
        description=template.description,
        start_date=template.start_date,
        end_date=template.end_date,
        estimated_time=template.estimated_time,
        priority=template.priority,
        calendar_id=template.calendar_id
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.delete("/api/templates/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(TemplateModel).filter(TemplateModel.id == template_id, TemplateModel.user_id == current_user.username).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

# ================= DATA MIGRATION ENDPOINT =================

@app.post("/api/migrate")
def migrate_data(data: MigrationData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Endpoint to migrate data from localStorage to database"""
    try:
        # Only clear existing data if there's actually data to migrate
        has_data_to_migrate = (
            len(data.todos) > 0 or 
            len(data.calendars) > 0 or 
            len(data.templates) > 0
        )
        
        if not has_data_to_migrate:
            return {"message": "No data to migrate", "migrated": {
                "todos": 0,
                "calendars": 0,
                "templates": 0
            }}
        
        # Clear existing data for this user only (only if we have data to replace it)
        db.query(TodoModel).filter(TodoModel.user_id == current_user.username).delete()
        db.query(CalendarModel).filter(CalendarModel.user_id == current_user.username).delete()
        db.query(TemplateModel).filter(TemplateModel.user_id == current_user.username).delete()
        
        # Migrate calendars
        for cal_data in data.calendars:
            calendar = CalendarModel(
                id=cal_data.get('id', str(int(time.time() * 1000))),
                user_id=current_user.username,
                name=cal_data['name'],
                color=cal_data['color'],
                is_default=cal_data.get('isDefault', False)
            )
            db.add(calendar)
        
        # Migrate templates
        for temp_data in data.templates:
            template = TemplateModel(
                id=temp_data.get('id', str(int(time.time() * 1000))),
                user_id=current_user.username,
                name=temp_data['name'],
                title=temp_data['title'],
                description=temp_data.get('description'),
                start_date=temp_data.get('startDate'),
                end_date=temp_data.get('endDate'),
                estimated_time=temp_data.get('estimatedTime'),
                priority=temp_data.get('priority', 'medium'),
                calendar_id=temp_data.get('calendarId')
            )
            db.add(template)
        
        # Migrate todos
        for todo_data in data.todos:
            # Convert frontend field names to backend field names
            todo = TodoModel(
                id=todo_data['id'],
                user_id=current_user.username,
                title=todo_data['title'],
                description=todo_data.get('description'),
                start_date=todo_data.get('startDate'),
                end_date=todo_data.get('endDate'),
                estimated_time=todo_data.get('estimatedTime'),
                priority=todo_data.get('priority', 'medium'),
                calendar_id=todo_data.get('calendarId'),
                is_completed=todo_data.get('isCompleted', False),
                created_at=datetime.fromisoformat(todo_data['createdAt'].replace('Z', '+00:00')) if todo_data.get('createdAt') else datetime.utcnow(),
                completed_at=datetime.fromisoformat(todo_data['completedAt'].replace('Z', '+00:00')) if todo_data.get('completedAt') else None,
                is_recurring=todo_data.get('isRecurring', False),
                recurring_pattern=todo_data.get('recurringPattern'),
                recurring_count=todo_data.get('recurringCount')
            )
            db.add(todo)
        
        db.commit()
        return {"message": "Data migrated successfully", "migrated": {
            "todos": len(data.todos),
            "calendars": len(data.calendars),
            "templates": len(data.templates)
        }}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Migration failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 