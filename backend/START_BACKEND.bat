@echo off
echo ========================================
echo Starting IPO Allotment Backend Server
echo ========================================
echo.
echo Server will start on: http://localhost:8000
echo Health check: http://localhost:8000/health
echo.
echo Please wait...
echo.

cd /d "%~dp0"
python main.py

pause

