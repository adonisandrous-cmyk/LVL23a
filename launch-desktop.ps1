# LEVEL 23 Legal AI Suite - PowerShell Desktop Launcher
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "    LEVEL 23 LEGAL AI SUITE - DESKTOP & ON-PREMISES CONNECTOR         " -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan

# Resolve actual directory where the script is stored
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
if (-not $scriptDir -or -not (Test-Path $scriptDir)) {
    $scriptDir = $PWD.Path
}
Set-Location $scriptDir

$baseDir = Join-Path $HOME "iiiamadex"
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
    Write-Host "[OK] Created on-premises storage folder: $baseDir" -ForegroundColor Green
}

# Locate bridge file
$bridgeFile = Join-Path $scriptDir "iiiamadex-desktop-bridge.js"
if (-not (Test-Path $bridgeFile)) {
    $bridgeFile = Join-Path $baseDir "iiiamadex-desktop-bridge.js"
}

Write-Host "[1/2] Bootstrapping Local Bridge Daemon on port 4321..." -ForegroundColor White
if (Test-Path $bridgeFile) {
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "`"$bridgeFile`"" -WorkingDirectory $scriptDir
    Write-Host "[OK] Desktop Bridge Daemon started from $bridgeFile" -ForegroundColor Green
} else {
    Write-Host "[WARN] Could not find iiiamadex-desktop-bridge.js in $scriptDir or $baseDir" -ForegroundColor Yellow
}

Write-Host "[2/2] Opening LEVEL 23 Legal Suite in Desktop Mode..." -ForegroundColor White
Start-Process "http://localhost:3000"

Write-Host "[SUCCESS] Level 23 Legal is active." -ForegroundColor Green
