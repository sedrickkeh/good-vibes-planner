# Good Vibes Backend API

A FastAPI backend for the Good Vibes calendar application with SQLite database storage.

## Features

- **RESTful API** for todos, calendars, projects, and templates
- **SQLite Database** for persistent storage (no setup required)
- **CORS Support** for frontend integration  
- **Data Migration** endpoint to transfer localStorage data
- **Auto-generated API docs** at `/docs`

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000

## API Endpoints

### Todos
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `GET /api/todos/{id}` - Get specific todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

### Calendars
- `GET /api/calendars` - Get all calendars
- `POST /api/calendars` - Create calendar
- `PUT /api/calendars/{id}` - Update calendar
- `DELETE /api/calendars/{id}` - Delete calendar

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/{id}` - Delete template

### Data Migration
- `POST /api/migrate` - Migrate data from localStorage

## Database

The SQLite database (`good_vibes.db`) is created automatically with these tables:
- `todos` - Task entries with dates, priorities, etc.
- `calendars` - Calendar containers with colors
- `projects` - Project categories for organization
- `templates` - Saved task templates

Default projects (Personal, Work, Health) are created automatically.

## Data Migration

To migrate your existing localStorage data to the database:

1. Open browser dev tools on your frontend
2. Copy your localStorage data:
   ```js
   JSON.stringify(JSON.parse(localStorage.getItem('good-vibes-data')))
   ```
3. Use the migration endpoint via the API docs at `/docs`
4. Or use curl:
   ```bash
   curl -X POST "http://localhost:8000/api/migrate" \
        -H "Content-Type: application/json" \
        -d '{"todos": [], "calendars": [], "projects": [], "templates": []}'
   ```

## Development

### Project Structure
```
backend/
├── main.py          # FastAPI application
├── models.py        # SQLAlchemy database models  
├── schemas.py       # Pydantic validation schemas
├── database.py      # Database configuration
├── requirements.txt # Python dependencies
└── good_vibes.db   # SQLite database (created automatically)
```

### Running in Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing the API
Visit http://localhost:8000/docs for interactive API documentation and testing.

## Deployment

### Free Hosting Options

**Railway** (Recommended):
1. Connect your GitHub repo to Railway
2. Deploy from the `backend/` folder
3. Railway will auto-detect FastAPI and handle deployment

**Render**:
1. Connect GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python main.py`

**PythonAnywhere**:
1. Upload files to your account
2. Set up a web app with manual configuration
3. Point to your `main.py` file

## Environment Variables

No environment variables required! The app works out of the box with SQLite.

For production, you may want to configure:
- `DATABASE_URL` - Custom database URL
- `PORT` - Server port (default: 8000)

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:3000`

Update the `allow_origins` in `main.py` for production URLs. 