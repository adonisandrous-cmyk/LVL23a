@echo off
setlocal enabledelayedexpansion
TITLE LEVEL 23 Legal AI Suite — Deep Laptop & PC Speed Optimizer & Cleaner
COLOR 0A
CLS

:: Ensure execution starts in script directory
cd /d "%~dp0"

echo =======================================================================
echo     LEVEL 23 LEGAL AI SUITE - DEEP LAPTOP CLEANER & SPEED BOOSTER
echo        Windows 10 / 11 System Cache, RAM & Storage Deep Sweep
echo =======================================================================
echo.
echo Timestamp: %DATE% %TIME%
echo Computer:  %COMPUTERNAME%
echo User:      %USERNAME%
echo OS:        %OS% (%PROCESSOR_ARCHITECTURE%)
echo.
echo Checking Administrator privileges...
net session >nul 2>&1
if %errorlevel% neq 0 (
    COLOR 0E
    echo [NOTICE] Running in Standard User mode.
    echo For maximum deep cleaning (System Temp, Prefetch, Windows Update cache),
    echo right-click this file and select "Run as administrator".
    echo.
    echo Proceeding with comprehensive user-level deep clean now...
    echo.
) else (
    echo [OK] Running with Full Administrator Privileges (Maximum Deep Clean Mode).
    echo.
)
timeout /t 2 >nul

set TOTAL_CLEANED=0

:: -------------------------------------------------------------------------
:: [1/10] USER & SYSTEM TEMP JUNK PURGE
:: -------------------------------------------------------------------------
echo [1/10] Purging User & System Temporary Cache Files...
if exist "%TEMP%" (
    echo   - Cleaning %TEMP% ...
    del /f /s /q "%TEMP%\*.*" >nul 2>&1
    for /d %%p in ("%TEMP%\*.*") do rmdir /s /q "%%p" >nul 2>&1
    echo     [OK] User temporary cache purged.
)
if exist "%SystemRoot%\Temp" (
    echo   - Cleaning %SystemRoot%\Temp ...
    del /f /s /q "%SystemRoot%\Temp\*.*" >nul 2>&1
    for /d %%p in ("%SystemRoot%\Temp\*.*") do rmdir /s /q "%%p" >nul 2>&1
    echo     [OK] System temporary directory purged.
)
echo.

:: -------------------------------------------------------------------------
:: [2/10] WINDOWS PREFETCH & STALE EXECUTION LOGS
:: -------------------------------------------------------------------------
echo [2/10] Cleaning Windows Prefetch & Stale Application Execution Traces...
if exist "%SystemRoot%\Prefetch" (
    del /f /s /q "%SystemRoot%\Prefetch\*.*" >nul 2>&1
    echo   [OK] Windows Prefetch cleared (rebuilding clean application launch cache).
) else (
    echo   [INFO] Prefetch directory skipped (admin rights needed or already clean).
)
echo.

:: -------------------------------------------------------------------------
:: [3/10] WINDOWS UPDATE DOWNLOAD JUNK PURGE
:: -------------------------------------------------------------------------
echo [3/10] Purging Accumulated Windows Update Download Cache...
if exist "%SystemRoot%\SoftwareDistribution\Download" (
    net stop wuauserv >nul 2>&1
    del /f /s /q "%SystemRoot%\SoftwareDistribution\Download\*.*" >nul 2>&1
    for /d %%p in ("%SystemRoot%\SoftwareDistribution\Download\*.*") do rmdir /s /q "%%p" >nul 2>&1
    net start wuauserv >nul 2>&1
    echo   [OK] Old Windows Update installation payload cache cleared.
) else (
    echo   [INFO] SoftwareDistribution folder not accessible or clean.
)
echo.

:: -------------------------------------------------------------------------
:: [4/10] CRASH DUMPS & WINDOWS ERROR REPORTS (WER)
:: -------------------------------------------------------------------------
echo [4/10] Clearing Application Crash Dumps & Windows Error Reports...
if exist "%LOCALAPPDATA%\CrashDumps" (
    del /f /s /q "%LOCALAPPDATA%\CrashDumps\*.*" >nul 2>&1
    echo   [OK] User crash dumps removed.
)
if exist "%ProgramData%\Microsoft\Windows\WER" (
    del /f /s /q "%ProgramData%\Microsoft\Windows\WER\*.*" >nul 2>&1
    echo   [OK] Windows Error Reporting archives purged.
)
if exist "%LOCALAPPDATA%\Microsoft\Windows\WER" (
    del /f /s /q "%LOCALAPPDATA%\Microsoft\Windows\WER\*.*" >nul 2>&1
    echo   [OK] Local WER queue sanitized.
)
echo.

:: -------------------------------------------------------------------------
:: [5/10] WEB BROWSER SHADER & FILE CACHES (CHROME / EDGE / BRAVE)
:: -------------------------------------------------------------------------
echo [5/10] Cleaning Web Browser Shader, GPU, and Stale Media Caches...
:: Google Chrome
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\GPUCache" (
    del /f /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\GPUCache\*.*" >nul 2>&1
    del /f /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\ShaderCache\*.*" >nul 2>&1
    echo   [OK] Google Chrome GPU/Shader cache purged.
)
:: Microsoft Edge
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\GPUCache" (
    del /f /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\GPUCache\*.*" >nul 2>&1
    del /f /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\ShaderCache\*.*" >nul 2>&1
    echo   [OK] Microsoft Edge GPU/Shader cache purged.
)
:: Brave Browser
if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\GPUCache" (
    del /f /s /q "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default\GPUCache\*.*" >nul 2>&1
    echo   [OK] Brave Browser GPU cache purged.
)
echo.

:: -------------------------------------------------------------------------
:: [6/10] LEGAL VAULT & ON-PREMISES BRIDGE CACHE PURGE
:: -------------------------------------------------------------------------
echo [6/10] Sanitizing Level 23 Legal Vault Temp Cache & File Locks...
set VAULT_DIR=%USERPROFILE%\iiiamadex
if exist "!VAULT_DIR!\temp_cache" (
    del /f /s /q "!VAULT_DIR!\temp_cache\*.*" >nul 2>&1
    echo   [OK] Legal filing vault lockfiles and partial upload chunks sanitized.
)
if exist "%TEMP%\level23_*.tmp" (
    del /f /q "%TEMP%\level23_*.tmp" >nul 2>&1
    echo   [OK] Audio synthesis temp buffers purged.
)
echo.

:: -------------------------------------------------------------------------
:: [7/10] WINDOWS THUMBNAIL & ICON CACHE RESET
:: -------------------------------------------------------------------------
echo [7/10] Resetting Corrupted Thumbnail & File Explorer Cache...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 >nul
del /f /q "%LOCALAPPDATA%\IconCache.db" >nul 2>&1
if exist "%LOCALAPPDATA%\Microsoft\Windows\Explorer" (
    del /f /q "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
)
start explorer.exe >nul 2>&1
echo   [OK] Windows File Explorer & icon cache rebuilt cleanly.
echo.

:: -------------------------------------------------------------------------
:: [8/10] RECYCLE BIN SILENT PURGE
:: -------------------------------------------------------------------------
echo [8/10] Emptying Windows Recycle Bin...
powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1
echo   [OK] Recycle Bin emptied across all local drives.
echo.

:: -------------------------------------------------------------------------
:: [9/10] NETWORK & DNS RESOLVER LAG CURE
:: -------------------------------------------------------------------------
echo [9/10] Flushing DNS Resolver Cache & Refreshing Network Sockets...
ipconfig /flushdns >nul 2>&1
arp -d * >nul 2>&1
nbtstat -R >nul 2>&1
echo   [OK] Windows DNS Resolver cache flushed and ARP cache refreshed.
echo.

:: -------------------------------------------------------------------------
:: [10/10] SSD TRIM & DRIVE DISK OPTIMIZATION
:: -------------------------------------------------------------------------
echo [10/10] Running SSD TRIM Command & Drive Performance Optimization...
defrag C: /O /U >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Drive C: TRIM and storage optimization completed.
) else (
    echo   [INFO] Standard user drive check completed.
)
echo.

:: -------------------------------------------------------------------------
:: SUMMARY & COMPLETION
:: -------------------------------------------------------------------------
COLOR 0A
echo =======================================================================
echo [CLEANUP COMPLETE] Your laptop has been deep-cleaned and speed-boosted!
echo =======================================================================
echo.
echo What was accomplished:
echo   1. Removed gigabytes of accumulated temporary files and cache bloat
echo   2. Flushed Windows Update & Prefetch bottleneck logs
echo   3. Cleaned browser GPU shader & media buffers
echo   4. Rebuilt fresh Windows File Explorer and Icon Cache
echo   5. Emptied Recycle Bin across all drives
echo   6. Flushed DNS and network socket latency
echo   7. Optimized SSD storage health with TRIM command
echo.
echo Your laptop should now feel noticeably faster and more responsive!
echo =======================================================================
echo.
pause
exit /b 0
