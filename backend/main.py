from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import time
from datetime import datetime

from database import get_db, init_db
from models import Todo as TodoModel, Calendar as CalendarModel, Project as ProjectModel, Template as TemplateModel
from schemas import (
    Todo, TodoCreate, TodoUpdate,
    Calendar, CalendarCreate, CalendarUpdate,
    Project, ProjectCreate, ProjectUpdate,
    Template, TemplateCreate,
    MigrationData
)

app = FastAPI(title="Good Vibes API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Health check
@app.get("/")
def read_root():
    return {"message": "Good Vibes API is running!"}

# ================= TODO ENDPOINTS =================

@app.get("/api/todos", response_model=List[Todo])
def get_todos(db: Session = Depends(get_db)):
    return db.query(TodoModel).all()

@app.post("/api/todos", response_model=Todo)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    # Generate ID using timestamp (matching frontend behavior)
    todo_id = str(int(time.time() * 1000))
    
    db_todo = TodoModel(
        id=todo_id,
        title=todo.title,
        description=todo.description,
        start_date=todo.start_date,
        end_date=todo.end_date,
        estimated_time=todo.estimated_time,
        priority=todo.priority,
        project_id=todo.project_id,
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
def get_todo(todo_id: str, db: Session = Depends(get_db)):
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/api/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: str, todo_update: TodoUpdate, db: Session = Depends(get_db)):
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
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
def delete_todo(todo_id: str, db: Session = Depends(get_db)):
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted successfully"}

# ================= CALENDAR ENDPOINTS =================

@app.get("/api/calendars", response_model=List[Calendar])
def get_calendars(db: Session = Depends(get_db)):
    return db.query(CalendarModel).all()

@app.post("/api/calendars", response_model=Calendar)
def create_calendar(calendar: CalendarCreate, db: Session = Depends(get_db)):
    # Generate ID using timestamp
    calendar_id = str(int(time.time() * 1000))
    
    # Check if this will be the first calendar (make it default)
    is_first_calendar = db.query(CalendarModel).count() == 0
    
    db_calendar = CalendarModel(
        id=calendar_id,
        name=calendar.name,
        color=calendar.color,
        is_default=is_first_calendar or calendar.is_default
    )
    
    db.add(db_calendar)
    db.commit()
    db.refresh(db_calendar)
    return db_calendar

@app.put("/api/calendars/{calendar_id}", response_model=Calendar)
def update_calendar(calendar_id: str, calendar_update: CalendarUpdate, db: Session = Depends(get_db)):
    calendar = db.query(CalendarModel).filter(CalendarModel.id == calendar_id).first()
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    for field, value in calendar_update.dict(exclude_unset=True).items():
        setattr(calendar, field, value)
    
    db.commit()
    db.refresh(calendar)
    return calendar

@app.delete("/api/calendars/{calendar_id}")
def delete_calendar(calendar_id: str, db: Session = Depends(get_db)):
    calendar = db.query(CalendarModel).filter(CalendarModel.id == calendar_id).first()
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    # Delete associated todos
    db.query(TodoModel).filter(TodoModel.calendar_id == calendar_id).delete()
    
    db.delete(calendar)
    db.commit()
    return {"message": "Calendar and associated todos deleted successfully"}

# ================= PROJECT ENDPOINTS =================

@app.get("/api/projects", response_model=List[Project])
def get_projects(db: Session = Depends(get_db)):
    return db.query(ProjectModel).all()

@app.post("/api/projects", response_model=Project)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    project_id = str(int(time.time() * 1000))
    
    db_project = ProjectModel(
        id=project_id,
        name=project.name,
        color=project.color,
        description=project.description
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.put("/api/projects/{project_id}", response_model=Project)
def update_project(project_id: str, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated todos
    db.query(TodoModel).filter(TodoModel.project_id == project_id).delete()
    
    db.delete(project)
    db.commit()
    return {"message": "Project and associated todos deleted successfully"}

# ================= TEMPLATE ENDPOINTS =================

@app.get("/api/templates", response_model=List[Template])
def get_templates(db: Session = Depends(get_db)):
    return db.query(TemplateModel).all()

@app.post("/api/templates", response_model=Template)
def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    template_id = str(int(time.time() * 1000))
    
    db_template = TemplateModel(
        id=template_id,
        name=template.name,
        title=template.title,
        description=template.description,
        start_date=template.start_date,
        end_date=template.end_date,
        estimated_time=template.estimated_time,
        priority=template.priority,
        project_id=template.project_id,
        calendar_id=template.calendar_id
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.delete("/api/templates/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(TemplateModel).filter(TemplateModel.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

# ================= DATA MIGRATION ENDPOINT =================

@app.post("/api/migrate")
def migrate_data(data: MigrationData, db: Session = Depends(get_db)):
    """Endpoint to migrate data from localStorage to database"""
    try:
        # Clear existing data
        db.query(TodoModel).delete()
        db.query(CalendarModel).delete()
        db.query(TemplateModel).delete()
        # Don't clear projects as they have defaults
        
        # Migrate calendars
        for cal_data in data.calendars:
            calendar = CalendarModel(
                id=cal_data.get('id', str(int(time.time() * 1000))),
                name=cal_data['name'],
                color=cal_data['color'],
                is_default=cal_data.get('isDefault', False)
            )
            db.add(calendar)
        
        # Migrate projects (only if not default ones)
        for proj_data in data.projects:
            if proj_data['id'] not in ['personal', 'work', 'health']:
                project = ProjectModel(
                    id=proj_data['id'],
                    name=proj_data['name'],
                    color=proj_data['color'],
                    description=proj_data.get('description')
                )
                db.add(project)
        
        # Migrate templates
        for temp_data in data.templates:
            template = TemplateModel(
                id=temp_data.get('id', str(int(time.time() * 1000))),
                name=temp_data['name'],
                title=temp_data['title'],
                description=temp_data.get('description'),
                start_date=temp_data.get('startDate'),
                end_date=temp_data.get('endDate'),
                estimated_time=temp_data.get('estimatedTime'),
                priority=temp_data.get('priority', 'medium'),
                project_id=temp_data['projectId'],
                calendar_id=temp_data.get('calendarId')
            )
            db.add(template)
        
        # Migrate todos
        for todo_data in data.todos:
            # Convert frontend field names to backend field names
            todo = TodoModel(
                id=todo_data['id'],
                title=todo_data['title'],
                description=todo_data.get('description'),
                start_date=todo_data.get('startDate'),
                end_date=todo_data.get('endDate'),
                estimated_time=todo_data.get('estimatedTime'),
                priority=todo_data.get('priority', 'medium'),
                project_id=todo_data['projectId'],
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
            "projects": len([p for p in data.projects if p['id'] not in ['personal', 'work', 'health']]),
            "templates": len(data.templates)
        }}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Migration failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 