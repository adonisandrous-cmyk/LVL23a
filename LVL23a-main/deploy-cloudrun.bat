@echo off
setlocal enabledelayedexpansion
TITLE LEVEL 23 Legal AI Suite - Cloud Run One-Click Deployer
COLOR 0B
CLS

:: Ensure execution starts from the root project directory
cd /d "%~dp0"

echo =======================================================================
echo     LEVEL 23 LEGAL AI SUITE - GOOGLE CLOUD RUN ONE-CLICK DEPLOYER
echo =======================================================================
echo.
echo [1/5] Checking Google Cloud SDK (gcloud CLI) installation...
where gcloud >nul 2>&1
if %errorlevel% neq 0 (
    COLOR 0C
    echo.
    echo [ERROR] Google Cloud SDK (gcloud) was not found in your system PATH.
    echo.
    echo To deploy to Cloud Run, please install the Google Cloud CLI from:
    echo   https://cloud.google.com/sdk/docs/install
    echo.
    echo After installing, restart your terminal or double-click this file again.
    echo.
    pause
    exit /b 1
)
echo [OK] gcloud CLI detected.

:: 2. Check GCP Authentication & Project Configuration
echo.
echo [2/5] Checking Google Cloud Authentication...
for /f "tokens=*" %%a in ('gcloud config get-value account 2^>nul') do set CURRENT_ACCOUNT=%%a

if "%CURRENT_ACCOUNT%"=="" (
    echo [NOTICE] No active Google Cloud account detected. Initiating login...
    gcloud auth login
    if %errorlevel% neq 0 (
        COLOR 0C
        echo [ERROR] Authentication failed.
        pause
        exit /b 1
    )
) else (
    echo [OK] Authenticated as: %CURRENT_ACCOUNT%
)

:: Get or Set Project ID
for /f "tokens=*" %%p in ('gcloud config get-value project 2^>nul') do set CURRENT_PROJECT=%%p

echo.
if not "%CURRENT_PROJECT%"=="" if not "%CURRENT_PROJECT%"=="(unset)" (
    echo Current Active GCP Project: [%CURRENT_PROJECT%]
    set /p PROMPT_PROJECT="Press ENTER to use [%CURRENT_PROJECT%] or type a new Project ID: "
    if "!PROMPT_PROJECT!"=="" (
        set GCP_PROJECT=%CURRENT_PROJECT%
    ) else (
        set GCP_PROJECT=!PROMPT_PROJECT!
    )
) else (
    set /p GCP_PROJECT="Enter your Google Cloud Project ID: "
)

if "%GCP_PROJECT%"=="" (
    COLOR 0C
    echo [ERROR] Project ID cannot be empty.
    pause
    exit /b 1
)

echo Setting active project to: %GCP_PROJECT%...
gcloud config set project %GCP_PROJECT%
if %errorlevel% neq 0 (
    COLOR 0C
    echo [ERROR] Failed to set project %GCP_PROJECT%. Please check the Project ID.
    pause
    exit /b 1
)

:: 3. Configure Service Parameters
echo.
echo [3/5] Setting Deployment Parameters...
set SERVICE_NAME=level23-legal
set /p PROMPT_SERVICE="Enter Cloud Run Service Name [default: level23-legal]: "
if not "!PROMPT_SERVICE!"=="" set SERVICE_NAME=!PROMPT_SERVICE!

set REGION=us-central1
set /p PROMPT_REGION="Enter Cloud Run Region [default: us-central1]: "
if not "!PROMPT_REGION!"=="" set REGION=!PROMPT_REGION!

:: 4. Enable Required Google Cloud APIs
echo.
echo [4/5] Enabling necessary Google Cloud APIs (Cloud Run, Cloud Build, Artifact Registry)...
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
if %errorlevel% neq 0 (
    echo [WARNING] Could not verify/enable APIs automatically. Proceeding with deployment...
)

:: 5. Build and Deploy
echo.
echo [5/5] Deploying %SERVICE_NAME% to Google Cloud Run (%REGION%)...
echo This builds the container and provisions your scalable HTTPS endpoint.
echo Please wait...
echo -----------------------------------------------------------------------

gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --port 3000 ^
  --memory 1Gi ^
  --cpu 1 ^
  --min-instances 0 ^
  --max-instances 10

if %errorlevel% neq 0 (
    COLOR 0C
    echo.
    echo =======================================================================
    echo [ERROR] Deployment encountered an error. Please check the logs above.
    echo =======================================================================
    pause
    exit /b 1
)

:: Retrieve the deployed service URL
for /f "tokens=*" %%u in ('gcloud run services describe %SERVICE_NAME% --platform managed --region %REGION% --format="value(status.url)" 2^>nul') do set DEPLOYED_URL=%%u

COLOR 0A
echo.
echo =======================================================================
echo [SUCCESS] LEVEL 23 Legal AI Suite is LIVE on Google Cloud Run!
if not "%DEPLOYED_URL%"=="" (
    echo.
    echo Public HTTPS URL: %DEPLOYED_URL%
    echo.
    echo Opening your live application in your default browser...
    start "" "%DEPLOYED_URL%"
)
echo =======================================================================
echo.
pause
exit /b 0
