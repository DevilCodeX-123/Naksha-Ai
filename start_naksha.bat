@echo off
echo ==============================================
echo NAKSHA Portal - Complete Startup Script
echo ==============================================

echo [1/2] Starting Python FastAPI Backend...
start cmd /k "cd naksha_backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo [2/2] Starting React Frontend...
start cmd /k "cd naksha_frontend && npm start"

echo.
echo Both servers are starting up! 
echo The frontend should automatically open in your browser at http://localhost:3000
echo The backend API will be available at http://localhost:8000
echo.
pause
