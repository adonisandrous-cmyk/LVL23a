@echo off
TITLE LEVEL 23 Legal AI Suite — Windows Desktop Packager
COLOR 0E
CLS

cd /d "%~dp0"

echo ===============================================================================
echo     LEVEL 23 LEGAL AI SUITE - WINDOWS DESKTOP PACKAGE BUILDER
echo ===============================================================================
echo  Builds and packages the complete offline Windows desktop workstation.
echo ===============================================================================
echo.

:: 1. Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to package the desktop application.
    pause
    exit /b 1
)

:: 2. Build Production Web Assets
echo [1/4] Building production UI and backend bundles...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build step failed. Review compilation logs.
    pause
    exit /b 1
)
echo [OK] Production bundles compiled into /dist.

:: 3. Prepare Portable Desktop Directory
set DIST_DIR=dist-desktop\Level23-Legal-Windows
echo [2/4] Assembling portable desktop distribution in %DIST_DIR%...

if exist "%DIST_DIR%" rd /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\dist"

xcopy /E /I /Y "dist" "%DIST_DIR%\dist" >nul
xcopy /E /I /Y "templates" "%DIST_DIR%\templates" >nul
if exist "forms" xcopy /E /I /Y "forms" "%DIST_DIR%\forms" >nul
copy /Y "package.json" "%DIST_DIR%\" >nul
copy /Y "electron-main.cjs" "%DIST_DIR%\" >nul
copy /Y "iiiamadex-desktop-bridge.js" "%DIST_DIR%\" >nul
copy /Y "launch-windows-desktop.bat" "%DIST_DIR%\" >nul
copy /Y "create-windows-shortcut.bat" "%DIST_DIR%\" >nul

:: Create Run.bat in destination folder
echo @echo off > "%DIST_DIR%\Run-Level23-Legal.bat"
echo cd /d "%%~dp0" >> "%DIST_DIR%\Run-Level23-Legal.bat"
echo call launch-windows-desktop.bat >> "%DIST_DIR%\Run-Level23-Legal.bat"

echo [3/4] Ensuring desktop launcher scripts are bundled...
echo [OK] Standalone runnable folder created at: %DIST_DIR%

:: 4. Done
echo.
echo ===============================================================================
echo [SUCCESS] Windows Desktop package created successfully!
echo Location: %CD%\%DIST_DIR%
echo.
echo To run your packaged app:
echo 1. Open the folder: %DIST_DIR%
echo 2. Double-click "Run-Level23-Legal.bat" or "launch-windows-desktop.bat"
echo ===============================================================================
echo.
pause
