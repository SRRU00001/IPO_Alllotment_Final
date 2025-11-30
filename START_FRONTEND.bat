@echo off
echo ========================================
echo Starting IPO Allotment Frontend Server
echo ========================================
echo.
echo Backend should be running on: http://localhost:8000
echo Frontend will start on: http://localhost:5173
echo.
echo Please wait...
echo.

cd /d "%~dp0"
call npm run dev

pause

