@echo off
TITLE LEVEL 23 Legal AI Suite — Windows Desktop Workstation
COLOR 0B
CLS

:: Ensure execution always starts from script root directory
cd /d "%~dp0"

echo ===============================================================================
echo     LEVEL 23 LEGAL AI SUITE - NATIVE WINDOWS DESKTOP WORKSTATION
echo ===============================================================================
echo  Universal Court Form Automation Pipeline (FL-141 / FL-120 / EOIR-33)
echo  Local AI Integration: Ollama (Offline) + Free-Tier Cloud Cascades
echo ===============================================================================
echo.

:: 1. Verify Node.js Environment
echo [1/5] Checking Node.js runtime environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js 18+ (LTS) from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected.

:: 2. Ensure Local On-Premises Legal Vault Folder
echo [2/5] Initializing on-premises legal case folder in %USERPROFILE%\iiiamadex...
if not exist "%USERPROFILE%\iiiamadex" (
    mkdir "%USERPROFILE%\iiiamadex"
    echo [OK] Created secure local legal directory: %USERPROFILE%\iiiamadex
) else (
    echo [OK] Local legal directory verified: %USERPROFILE%\iiiamadex
)

:: 3. Configure and Launch Ollama Local AI Daemon
echo [3/5] Checking Ollama Local AI Daemon (Port 11434)...
set OLLAMA_ORIGINS=*
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Ollama detected on your system. Unlocking CORS origins for web/desktop...
    start /b "" ollama serve >nul 2>&1
    echo [OK] Ollama daemon initialized on http://localhost:11434 with OLLAMA_ORIGINS=*
) else (
    echo [INFO] Ollama not found in PATH.
    echo        The suite will automatically use free-tier cloud backup models (Gemma 2 / Llama 3).
    echo        To enable 100%% offline air-gapped AI, install Ollama from https://ollama.com
)

:: 4. Start Local Filesystem Bridge Daemon
echo [4/5] Bootstrapping local filesystem bridge on port 4321...
if exist "iiiamadex-desktop-bridge.js" (
    start /b "" node iiiamadex-desktop-bridge.js >nul 2>&1
    echo [OK] Storage bridge daemon running on http://localhost:4321
)

:: 5. Launch Native Desktop App or Localhost Browser
echo [5/5] Launching LEVEL 23 Legal AI Suite...
echo.
echo ===============================================================================
echo [IMPORTANT ADDRESS NOTICE]
echo  Target Address: http://localhost:3000 (or http://127.0.0.1:3000)
echo  NEVER use http://0.0.0.0:3000 in your browser!
echo  Chrome and Edge block 0.0.0.0 with ERR_ADDRESS_INVALID.
echo ===============================================================================
echo.

:: Start server if not already running
start /b "" npm run dev >nul 2>&1

:: Check if electron is locally installed
if exist "node_modules\electron" (
    start "" npx electron electron-main.cjs
) else (
    echo [INFO] Opening desktop interface in browser at http://localhost:3000...
    timeout /t 3 /nobreak >nul
    start "" "http://localhost:3000"
)

exit /b 0
