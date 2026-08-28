@echo off
TITLE LEVEL 23 Legal AI Suite — Desktop Launcher
COLOR 0B
CLS

:: Ensure execution from the batch file's actual directory
cd /d "%~dp0"

echo =======================================================================
echo     LEVEL 23 LEGAL AI SUITE - ON-PREMISES DESKTOP RUNNER & BRIDGE
echo =======================================================================
echo.
echo [1/3] Checking Node.js runtime environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected! Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b
)

echo [2/3] Initializing local client directory C:\Users\%USERNAME%\iiiamadex...
if not exist "%USERPROFILE%\iiiamadex" (
    mkdir "%USERPROFILE%\iiiamadex"
    echo [OK] Created on-premises legal case storage folder.
)

echo [3/3] Launching Background Local Bridge & Google Drive Daemon...
start /b node iiiamadex-desktop-bridge.js

echo.
echo =======================================================================
echo [SUCCESS] Local Bridge Daemon is LIVE on http://localhost:4321
echo [OK] Opening LEVEL 23 Legal AI Suite in your preferred browser...
echo =======================================================================
echo.

start "" "http://localhost:3000"

exit
