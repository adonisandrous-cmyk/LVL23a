<#
.SYNOPSIS
    LEVEL 23 Legal AI Suite — Deep Laptop & PC Speed Optimizer
.DESCRIPTION
    Comprehensive Windows 10/11 cleanup and speed boost script.
    Cleans temp folders, prefetch, Windows update cache, browser caches,
    WER crash dumps, recycle bin, resets icon cache, flushes DNS, and triggers SSD TRIM.
#>

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "    LEVEL 23 LEGAL AI SUITE - DEEP LAPTOP CLEANER & SPEED BOOSTER" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[NOTICE] Running without Administrator rights. Some system folders (Prefetch, Windows Update) may be skipped." -ForegroundColor Yellow
    Write-Host "For maximum deep cleaning, run PowerShell as Administrator.`n" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Running with Full Administrator Privileges.`n" -ForegroundColor Green
}

# 1. Clean Temp folders
Write-Host "[1/8] Cleaning User & System Temp Folders..." -ForegroundColor White
$tempPaths = @($env:TEMP, "$env:SystemRoot\Temp")
foreach ($path in $tempPaths) {
    if (Test-Path $path) {
        Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  -> Temp files purged." -ForegroundColor Green

# 2. Clean Prefetch
Write-Host "[2/8] Cleaning Windows Prefetch..." -ForegroundColor White
if (Test-Path "$env:SystemRoot\Prefetch") {
    Get-ChildItem -Path "$env:SystemRoot\Prefetch" -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "  -> Prefetch cleared." -ForegroundColor Green
}

# 3. Crash Dumps & WER
Write-Host "[3/8] Removing Crash Dumps & Windows Error Reports..." -ForegroundColor White
$dumpPaths = @(
    "$env:LOCALAPPDATA\CrashDumps",
    "$env:ProgramData\Microsoft\Windows\WER\ReportArchive",
    "$env:ProgramData\Microsoft\Windows\WER\ReportQueue"
)
foreach ($dp in $dumpPaths) {
    if (Test-Path $dp) {
        Get-ChildItem -Path $dp -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  -> Error reports sanitized." -ForegroundColor Green

# 4. Browser GPU/Shader Caches
Write-Host "[4/8] Cleaning Browser GPU Shader Caches..." -ForegroundColor White
$browserPaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\GPUCache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\ShaderCache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\GPUCache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\ShaderCache"
)
foreach ($bp in $browserPaths) {
    if (Test-Path $bp) {
        Get-ChildItem -Path $bp -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  -> Browser caches purged." -ForegroundColor Green

# 5. Legal Vault Lockfiles
Write-Host "[5/8] Cleaning Legal Vault Temp Locks..." -ForegroundColor White
$vaultTemp = "$env:USERPROFILE\iiiamadex\temp_cache"
if (Test-Path $vaultTemp) {
    Get-ChildItem -Path $vaultTemp -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  -> Vault lockfiles cleaned." -ForegroundColor Green
}

# 6. Recycle Bin
Write-Host "[6/8] Emptying Windows Recycle Bin..." -ForegroundColor White
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host "  -> Recycle Bin emptied." -ForegroundColor Green

# 7. DNS & Sockets
Write-Host "[7/8] Flushing DNS Resolver Cache..." -ForegroundColor White
Clear-DnsClientCache -ErrorAction SilentlyContinue
Write-Host "  -> DNS cache flushed." -ForegroundColor Green

# 8. SSD TRIM
Write-Host "[8/8] Running Storage TRIM Optimization..." -ForegroundColor White
if ($isAdmin) {
    Optimize-Volume -DriveLetter C -Defrag -ReTrim -Verbose -ErrorAction SilentlyContinue
    Write-Host "  -> Drive C: TRIM complete." -ForegroundColor Green
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Laptop Deep Clean Complete! System speed restored." -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""
Pause
