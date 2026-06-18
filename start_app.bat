@echo off
title NexusBill Startup
echo ========================================
echo   NexusBill - Advanced Billing System
echo ========================================
echo.

:: Check for Node.js
where npx >nul 2>nul
if %errorlevel%==0 (
    echo [Info] Node.js detected. Starting server...
    echo [Action] Your browser will open to http://localhost:3000
    start http://localhost:3000
    npx -y serve -s . -l 3000
    exit /b
)

:: Check for Python
where python >nul 2>nul
if %errorlevel%==0 (
    echo [Info] Python detected. Starting server...
    echo [Action] Your browser will open to http://localhost:8000
    start http://localhost:8000
    python -m http.server 8000
    exit /b
)

echo [Error] Neither Node.js nor Python was found on your system.
echo.
echo To run this system perfectly without VS Code, please:
echo 1. Install Node.js (https://nodejs.org) OR Python (https://python.org)
echo 2. Or continue using VS Code's "Live Server" extension.
echo.
echo Press any key to exit...
pause >nul
