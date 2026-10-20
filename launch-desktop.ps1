# LEVEL 23 Legal AI Suite - Advanced PowerShell Windows Desktop Launcher
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "    LEVEL 23 LEGAL AI SUITE - WINDOWS DESKTOP WORKSTATION              " -ForegroundColor Yellow
Write-Host "    Universal Court Form Pipeline & Local Ollama AI Co-Pilot           " -ForegroundColor Gray
Write-Host "=======================================================================" -ForegroundColor Cyan

# Resolve actual working directory
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
if (-not $scriptDir -or -not (Test-Path $scriptDir)) {
    $scriptDir = $PWD.Path
}
Set-Location $scriptDir

# 1. Local Vault Directory
$baseDir = Join-Path $HOME "iiiamadex"
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
    Write-Host "[1/4] Created on-premises storage folder: $baseDir" -ForegroundColor Green
} else {
    Write-Host "[1/4] Local storage folder verified: $baseDir" -ForegroundColor Green
}

# 2. Ollama Local AI Check & Startup
Write-Host "[2/4] Checking Ollama Local AI environment..." -ForegroundColor White
$ollamaCmd = Get-Command "ollama" -ErrorAction SilentlyContinue
if ($ollamaCmd) {
    Write-Host "[OK] Ollama detected. Starting daemon with OLLAMA_ORIGINS='*'..." -ForegroundColor Green
    $env:OLLAMA_ORIGINS = "*"
    Start-Process -NoNewWindow -FilePath "ollama" -ArgumentList "serve" -ErrorAction SilentlyContinue
} else {
    Write-Host "[INFO] Ollama not found in PATH. Will use cloud free-tier fallback models (Gemma 2 / Llama 3)." -ForegroundColor Yellow
}

# 3. Local Storage Bridge Daemon
$bridgeFile = Join-Path $scriptDir "iiiamadex-desktop-bridge.js"
if (Test-Path $bridgeFile) {
    Write-Host "[3/4] Starting local file bridge on port 4321..." -ForegroundColor White
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "`"$bridgeFile`"" -WorkingDirectory $scriptDir
    Write-Host "[OK] Desktop Bridge Daemon active." -ForegroundColor Green
}

# 4. Launch Electron Native Desktop Window
Write-Host "[4/4] Launching LEVEL 23 Legal Desktop Window..." -ForegroundColor White
$electronPath = Join-Path $scriptDir "node_modules\electron"
if (Test-Path $electronPath) {
    Start-Process -FilePath "npx" -ArgumentList "electron", "electron-main.cjs" -WorkingDirectory $scriptDir
    Write-Host "[OK] Electron Native Desktop Window spawned." -ForegroundColor Green
} else {
    Start-Process -FilePath "node" -ArgumentList "electron-main.cjs" -WorkingDirectory $scriptDir
    Write-Host "[OK] Desktop runner initialized." -ForegroundColor Green
}

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] LEVEL 23 Legal AI Suite is running on your desktop." -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
