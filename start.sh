#!/bin/bash

echo "🌟 Good Vibes Calendar Setup & Start Script 🌟"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.7+ first."
    exit 1
fi

# Set Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo "✅ Node.js and Python are available"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Install backend dependencies if needed
if [ ! -d "backend/venv" ]; then
    echo "🐍 Setting up Python virtual environment..."
    cd backend
    $PYTHON_CMD -m venv venv
    
    # Activate virtual environment
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Backend dependencies already installed"
fi

echo ""
echo "🚀 Starting Good Vibes Calendar..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
if command -v concurrently &> /dev/null; then
    npm run dev:full
else
    echo "Installing concurrently for running both servers..."
    npm install concurrently
    npm run dev:full
fi 