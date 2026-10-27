@echo off
TITLE LEVEL 23 Legal AI Suite — Desktop Launcher & Ollama Bridge
COLOR 0B
CLS

:: Ensure execution from the batch file's actual directory
cd /d "%~dp0"

echo =======================================================================
echo     LEVEL 23 LEGAL AI SUITE - ON-PREMISES DESKTOP RUNNER & OLLAMA
echo =======================================================================
echo.
echo [1/4] Checking Node.js runtime environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected! Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b
)

echo [2/4] Initializing local client directory C:\Users\%USERNAME%\iiiamadex...
if not exist "%USERPROFILE%\iiiamadex" (
    mkdir "%USERPROFILE%\iiiamadex"
    echo [OK] Created on-premises legal case storage folder.
)

echo [3/4] Configuring Ollama Local AI CORS & Starting Daemon (Port 11434)...
set OLLAMA_ORIGINS=*
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    start /b "" ollama serve
    echo [OK] Ollama Local AI Daemon initialized on http://localhost:11434 (CORS Unlocked).
) else (
    echo [INFO] Ollama not found in PATH. Install from https://ollama.com for offline AI.
)

echo [4/4] Launching Background Local Filesystem Bridge (Port 4321)...
start /b node iiiamadex-desktop-bridge.js

echo.
echo =======================================================================
echo [SUCCESS] Local Bridge Daemon is LIVE on http://localhost:4321
echo [OK] Opening LEVEL 23 Legal AI Suite in your preferred browser...
echo =======================================================================
echo.

start "" "http://localhost:3000"

exit
