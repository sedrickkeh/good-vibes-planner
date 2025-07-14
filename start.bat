@echo off
echo 🌟 Good Vibes Calendar Setup & Start Script 🌟
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python is not installed. Please install Python 3.7+ first.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
    )
) else (
    set PYTHON_CMD=python
)

echo ✅ Node.js and Python are available

REM Install frontend dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

REM Install backend dependencies if needed
if not exist "backend\venv" (
    echo 🐍 Setting up Python virtual environment...
    cd backend
    %PYTHON_CMD% -m venv venv
    
    REM Activate virtual environment
    call venv\Scripts\activate.bat
    
    echo 📦 Installing backend dependencies...
    pip install -r requirements.txt
    cd ..
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo 🚀 Starting Good Vibes Calendar...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Check if concurrently is available
npm list concurrently >nul 2>&1
if errorlevel 1 (
    echo Installing concurrently for running both servers...
    npm install concurrently
)

REM Start both servers
npm run dev:full

pause 