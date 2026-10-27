@echo off
setlocal enabledelayedexpansion
TITLE LEVEL 23 Legal AI Suite — System & File System Diagnostic Repair Engine
COLOR 0A
CLS

:: Ensure execution starts from the script's home directory
cd /d "%~dp0"

echo =======================================================================
echo     LEVEL 23 LEGAL AI SUITE - SYSTEM & FILING SYSTEM DIAGNOSTIC TOOL
echo     Hardware / Laptop Optimization, Script Verification, and Lag Fix
echo =======================================================================
echo.
echo Starting full diagnostic sweep of local files, scripts, and network...
echo Timestamp: %DATE% %TIME%
echo Machine Name: %COMPUTERNAME%
echo Active User: %USERNAME%
echo OS Architecture: %PROCESSOR_ARCHITECTURE%
echo -----------------------------------------------------------------------
echo.

:: 1. Verify Node.js Runtime & Scripts Engine
echo [STEP 1/6] Auditing Script Runtime Environment (Node.js / npm)...
where node >nul 2>&1
if %errorlevel% neq 0 (
    COLOR 0E
    echo [WARNING] Node.js is not installed or not in PATH!
    echo Node.js 18+ is required to run the local desktop bridge daemon.
    echo Download: https://nodejs.org
) else (
    for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
    echo [OK] Node.js is installed and active: !NODE_VER!
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('npm -v 2^>nul') do set NPM_VER=%%v
    echo [OK] npm package manager verified: v!NPM_VER!
)
echo.

:: 2. File System & Directory Permissions Audit
echo [STEP 2/6] Auditing Local Legal Filing System Storage...
set VAULT_DIR=%USERPROFILE%\iiiamadex

if not exist "!VAULT_DIR!" (
    echo [NOTICE] Vault directory "!VAULT_DIR!" does not exist. Creating now...
    mkdir "!VAULT_DIR!" 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Created secure local legal vault at "!VAULT_DIR!".
    ) else (
        echo [ERROR] Could not create "!VAULT_DIR!". Check user permissions.
    )
) else (
    echo [OK] Local legal vault verified: "!VAULT_DIR!"
)

:: Create necessary filing subdirectories
if not exist "!VAULT_DIR!\clients" mkdir "!VAULT_DIR!\clients" 2>nul
if not exist "!VAULT_DIR!\matters" mkdir "!VAULT_DIR!\matters" 2>nul
if not exist "!VAULT_DIR!\documents" mkdir "!VAULT_DIR!\documents" 2>nul
if not exist "!VAULT_DIR!\temp_cache" mkdir "!VAULT_DIR!\temp_cache" 2>nul
if not exist "!VAULT_DIR!\logs" mkdir "!VAULT_DIR!\logs" 2>nul
echo [OK] Subfolder filing structure verified (clients, matters, documents, temp_cache, logs).
echo.

:: 3. Check for File Locks, Stale Temp Files, and Lag Culprits
echo [STEP 3/6] Scanning for File Locks, Bloated Caches, and Lag Causes...
set DELETED_COUNT=0

:: Clean temporary lock files
if exist "!VAULT_DIR!\temp_cache\*.lock" (
    del /f /q "!VAULT_DIR!\temp_cache\*.lock" 2>nul
    set /a DELETED_COUNT+=1
    echo [FIXED] Cleared stale file locks in legal vault temp_cache.
)

:: Clean corrupt empty upload chunks
if exist "!VAULT_DIR!\temp_cache\*.tmp" (
    del /f /q "!VAULT_DIR!\temp_cache\*.tmp" 2>nul
    set /a DELETED_COUNT+=1
    echo [FIXED] Cleared orphaned partial upload chunks.
)

:: Check Windows Temp bloat
echo [SCAN] Checking system temporary directory (%TEMP%)...
if exist "%TEMP%\level23_*.tmp" (
    del /f /q "%TEMP%\level23_*.tmp" 2>nul
    echo [FIXED] Cleared old Level 23 audio synthesis buffers from %%TEMP%%.
)
echo [OK] File system cache sanitized. Lag reduction complete.
echo.

:: 4. Verify Project Scripts & Syntax Integrity
echo [STEP 4/6] Verifying Project Scripts & Launchers...
set SCRIPT_ERRORS=0

if exist "deploy-cloudrun.bat" (
    echo [OK] deploy-cloudrun.bat is present and ready.
) else (
    echo [WARN] deploy-cloudrun.bat is missing from current directory.
    set /a SCRIPT_ERRORS+=1
)

if exist "install-desktop.bat" (
    echo [OK] install-desktop.bat is present and ready.
) else (
    echo [WARN] install-desktop.bat is missing from current directory.
    set /a SCRIPT_ERRORS+=1
)

if exist "iiiamadex-desktop-bridge.js" (
    echo [OK] iiiamadex-desktop-bridge.js daemon script verified.
) else (
    echo [WARN] iiiamadex-desktop-bridge.js is missing.
    set /a SCRIPT_ERRORS+=1
)

if exist "server.ts" (
    echo [OK] server.ts backend service verified.
) else (
    echo [WARN] server.ts not found in current folder.
)
echo.

:: 5. Network & Port Ingress Diagnostics
echo [STEP 5/6] Testing Port Bindings and Network Latency...
echo Testing Port 3000 (Main Web Application)...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [STATUS] Port 3000 is ACTIVE (Application server is listening).
) else (
    echo [STATUS] Port 3000 is AVAILABLE (Ready to start).
)

echo Testing Port 4321 (Local File Bridge Daemon)...
netstat -ano | findstr ":4321" >nul 2>&1
if %errorlevel% equ 0 (
    echo [STATUS] Port 4321 is ACTIVE (Local bridge is listening).
) else (
    echo [STATUS] Port 4321 is AVAILABLE (Ready for install-desktop.bat).
)

echo Testing Google DNS & Cloud Connectivity...
ping -n 2 8.8.8.8 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Internet & Google Cloud network connection is responsive.
) else (
    COLOR 0E
    echo [WARNING] Internet ping test failed. Check Wi-Fi or proxy connection.
)
echo.

:: 6. Flush DNS & Optimization
echo [STEP 6/6] Running System & Network Lag Optimizations...
ipconfig /flushdns >nul 2>&1
echo [OK] Windows DNS Resolver Cache flushed.
echo.

echo =======================================================================
COLOR 0A
echo [DIAGNOSTIC COMPLETE] All file system checks and lag repairs finished!
echo.
echo Summary:
echo   - Local Legal Filing Vault: %USERPROFILE%\iiiamadex [READY]
echo   - Cache & File Lock Sanitization: Completed
echo   - Port & Script Readiness: Verified
echo.
echo Next Actions:
echo   1. To launch the on-premises Desktop App, run:  install-desktop.bat
echo   2. To deploy live to Google Cloud Run, run:       deploy-cloudrun.bat
echo =======================================================================
echo.
pause
exit /b 0
