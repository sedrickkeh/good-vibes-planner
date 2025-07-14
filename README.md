# Good Vibes Calendar 📅✨

A beautiful, mindful calendar and task management webapp designed to help you stay organized and productive while maintaining good vibes! 

## Features 🌟

### 📊 **Two Main Views**
- **My Calendars**: Multi-calendar overview with color-coded tasks
- **Today View**: Focus on today's tasks with progress tracking

### 🔄 **Repeated Tasks & Templates**
- Create recurring tasks (daily, weekly, monthly)
- Save task templates for repeated workflows
- One-click creation from saved templates

### 📝 **Simple Task Creation**
- Quick and intuitive task creation form
- Rich metadata support (due dates, priorities, time estimates)
- Project categorization
- Detailed descriptions

### 📈 **Automatic Metadata Tracking**
- Automatic creation timestamps
- Completion tracking with timestamps
- Time estimation and tracking
- Priority management

### 🎨 **Fine-Grained Categorization**
- Multiple calendars with custom colors
- Multiple projects with custom colors
- Project-based task organization
- Visual project indicators
- Project performance analytics

### 📊 **Analytics & Insights**
- Completion rate tracking
- Time-based productivity analysis
- Project performance metrics
- Daily activity patterns
- Common task pattern recognition

### 🎯 **Smart Features**
- Overdue task identification
- Priority-based visual indicators
- Progress bars and completion rates
- Quick task editing and deletion
- Responsive design for all devices
- **Database persistence** - your data is saved permanently!

## Tech Stack 🛠️

### Frontend
- **React 18** with Vite
- **Tailwind CSS** with custom animations
- **Lucide React** for icons
- **date-fns** for date handling
- **React Context** + useReducer for state management

### Backend
- **FastAPI** (Python) for REST API
- **SQLAlchemy** for database ORM
- **SQLite** for data storage (no setup required)
- **Pydantic** for data validation

## Getting Started 🚀

### Prerequisites
- Node.js (v14 or higher)
- Python 3.7 or higher
- npm or yarn

### Quick Setup (Recommended)

1. **Clone and install frontend dependencies**:
   ```bash
   git clone <your-repo>
   cd good-vibes
   npm install
   ```

2. **Set up Python backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run both frontend and backend**:
   ```bash
   npm run dev:full
   ```

This will start:
- Frontend at http://localhost:3000
- Backend API at http://localhost:8000
- API docs at http://localhost:8000/docs

### Manual Setup

If you prefer to run them separately:

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## Database Setup 💾

**No setup required!** The SQLite database is created automatically when you first run the backend.

### Data Migration

If you have existing data in localStorage (from the previous version), it will be **automatically migrated** to the database on first startup. The migration happens once and then localStorage is cleared.

### Manual Migration

You can also migrate data manually:

1. Open browser dev tools on your frontend
2. Copy your localStorage data:
   ```js
   JSON.stringify(JSON.parse(localStorage.getItem('good-vibes-data')))
   ```
3. Visit http://localhost:8000/docs
4. Use the `/api/migrate` endpoint to upload your data

## API Documentation 📚

The backend provides a full REST API. Visit http://localhost:8000/docs for interactive documentation.

### Main Endpoints:
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo
- Similar endpoints for calendars, projects, and templates

## Usage Guide 📚

### Creating Your First Task
1. Click the "New Todo" button in the top-right corner
2. Fill in the task details:
   - **Title**: What needs to be done
   - **Description**: Additional details (optional)
   - **Dates**: Start and end dates for the task
   - **Estimated Time**: How long you think it will take
   - **Priority**: High, Medium, or Low
   - **Project**: Choose from your projects
   - **Calendar**: Choose which calendar to add it to

### Managing Projects
1. Click the settings icon in the header
2. Add new projects with custom colors
3. Edit or delete existing projects
4. View project completion statistics

### Managing Calendars
1. Go to the "My Calendars" tab
2. Click the settings icon to manage calendars
3. Create, edit, or delete calendars
4. Each calendar has its own color for easy identification

### Using Templates
1. When creating a task, check "Save as template"
2. Give your template a name
3. Use templates for recurring workflows
4. Templates appear as quick-select buttons

### Creating Recurring Tasks
1. In the task creation form, check "Create recurring task"
2. Choose the pattern (daily, weekly, monthly)
3. Set how many instances to create
4. All instances will be created with appropriate due dates

### Viewing Analytics
1. Click the analytics icon in the header
2. Choose your time range (week, month, all time)
3. View completion rates, project performance, and productivity insights
4. Identify patterns in your task management

### Task Management
- **Complete tasks**: Click the checkbox next to any task
- **Edit tasks**: Right-click and select "Edit" or click the three dots menu
- **Delete tasks**: Right-click and select "Delete" or use the three dots menu
- **Drag tasks**: In week view, drag tasks between days
- **Multi-day tasks**: Set different start and end dates

## Features in Detail 🔍

### My Calendars View
- **Aggregate View**: See all calendars combined at the top with color-coded tasks
- **Individual Calendar Views**: Each calendar shown separately below
- **Week Navigation**: Navigate weeks with today centered
- **Drag & Drop**: Move tasks between days
- **Multi-day Tasks**: Tasks can span multiple days
- **Right-click Context Menu**: Quick edit and delete

### Today View
- **Color-coded Tasks**: Tasks shown with their calendar colors
- **Calendar Grouping**: Tasks grouped by calendar
- **Progress Tracking**: Visual indicators for completion

### Analytics Dashboard
- **Summary Cards**: Total tasks, completed, completion rate, time saved
- **Daily Activity**: Track tasks created and completed each day
- **Project Performance**: See which projects are most/least productive
- **Priority Breakdown**: Understand your priority task distribution
- **Common Patterns**: Identify frequently used words in your tasks
- **Insights**: Get actionable insights about your productivity

### Data Persistence
- **Database Storage**: All data stored in SQLite database
- **Automatic Backup**: Database file can be backed up easily
- **Data Migration**: Automatic migration from localStorage
- **API Access**: Full REST API for data access

## Project Structure 📁

```
good-vibes/
├── src/                     # Frontend React application
│   ├── components/          # React components
│   ├── contexts/           # React context providers
│   ├── services/           # API client
│   └── ...
├── backend/                # Python FastAPI backend
│   ├── main.py            # FastAPI application
│   ├── models.py          # Database models
│   ├── schemas.py         # API schemas
│   ├── database.py        # Database configuration
│   └── requirements.txt   # Python dependencies
├── package.json           # Frontend dependencies
└── README.md             # This file
```

## Deployment 🚀

### Frontend Deployment
Deploy to any static hosting service:
- **Vercel** (recommended for React)
- **Netlify**
- **GitHub Pages**

### Backend Deployment
Deploy to any Python hosting service:
- **Railway** (recommended, free tier available)
- **Render** (free tier available)
- **PythonAnywhere** (free tier available)
- **Heroku**

**Important**: Update the `API_BASE_URL` in `src/services/api.js` to point to your deployed backend.

### Database in Production
For production, consider upgrading from SQLite to:
- **PostgreSQL** (recommended)
- **MySQL**
- **MongoDB**

Update the database URL in `backend/database.py`.

## Development 🛠️

### Running Tests
```bash
# Frontend
npm run lint

# Backend
cd backend
python -m pytest  # (if you add tests)
```

### API Development
- Visit http://localhost:8000/docs for interactive API documentation
- The API automatically validates requests and responses
- SQLite database file: `backend/good_vibes.db`

### Adding New Features
1. Add database model in `backend/models.py`
2. Add API schema in `backend/schemas.py`
3. Add API endpoints in `backend/main.py`
4. Add frontend API calls in `src/services/api.js`
5. Update frontend components to use new data

## Troubleshooting 🔧

### Backend won't start
- Make sure Python 3.7+ is installed
- Install dependencies: `pip install -r backend/requirements.txt`
- Check if port 8000 is available

### Frontend can't connect to backend
- Make sure backend is running on localhost:8000
- Check browser console for CORS errors
- Verify `API_BASE_URL` in `src/services/api.js`

### Data migration issues
- Check browser console for error messages
- Manually export localStorage data and use `/docs` endpoint
- Database is created automatically in `backend/good_vibes.db`

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test frontend and backend
5. Submit a pull request

## License 📄

MIT License - feel free to use this project however you'd like!

---

**Enjoy organizing your life with Good Vibes! 🌟** 