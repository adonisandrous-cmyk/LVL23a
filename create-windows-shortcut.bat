@echo off
TITLE Create Level 23 Legal AI Suite Desktop Shortcut
COLOR 0A
CLS

cd /d "%~dp0"

echo ===============================================================================
echo     CREATING WINDOWS DESKTOP SHORTCUT FOR LEVEL 23 LEGAL AI SUITE
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_BAT=%SCRIPT_DIR%launch-windows-desktop.bat
set ICON_FILE=%SCRIPT_DIR%public\favicon.ico
if not exist "%ICON_FILE%" set ICON_FILE=%SystemRoot%\System32\shell32.dll,220

set VBS_TEMP="%TEMP%\CreateLegalShortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > %VBS_TEMP%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\LEVEL 23 Legal AI Suite.lnk" >> %VBS_TEMP%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %VBS_TEMP%
echo oLink.TargetPath = "%TARGET_BAT%" >> %VBS_TEMP%
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> %VBS_TEMP%
echo oLink.Description = "LEVEL 23 Legal AI Suite - Desktop Workstation" >> %VBS_TEMP%
echo oLink.WindowStyle = 1 >> %VBS_TEMP%
echo oLink.Save >> %VBS_TEMP%

cscript //nologo %VBS_TEMP%
del %VBS_TEMP% >nul 2>&1

echo.
echo [SUCCESS] Shortcut created on your Windows Desktop!
echo "LEVEL 23 Legal AI Suite.lnk" is now ready.
echo Double-click that desktop icon anytime to launch your on-premises legal suite.
echo.
pause
