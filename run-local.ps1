# Запуск API + фронта одной командой (один терминал).
#
# Если ошибка "выполнение сценариев отключено" — НЕ запускай .ps1 напрямую, используй:
#   dev.cmd
#   start.cmd
# или в PowerShell:
#   Set-ExecutionPolicy -Scope Process Bypass; .\run-local.ps1
#
# Остановка: Ctrl+C в этом окне.

param(
    [switch]$TwoWindows,   # два отдельных окна PowerShell
    [switch]$NoFreePorts    # не освобождать 8080/5173 (если порт занят намеренно)
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new() } catch {}

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$web = Join-Path $root "web"
$apiUrl = "http://127.0.0.1:8080/api/health"
$siteUrl = "http://127.0.0.1:5173"

function Add-ToPathFront([string]$Dir) {
    if ($Dir -and (Test-Path -LiteralPath $Dir)) {
        $env:Path = "$Dir;$env:Path"
    }
}

function Find-Toolchain {
    foreach ($d in @("$env:ProgramFiles\Go\bin", "${env:ProgramFiles(x86)}\Go\bin", "C:\Go\bin")) {
        if (Test-Path -LiteralPath (Join-Path $d "go.exe")) {
            Add-ToPathFront $d
            return
        }
    }
    $sdkRoot = Join-Path $env:USERPROFILE "sdk"
    if (Test-Path -LiteralPath $sdkRoot) {
        $latest = Get-ChildItem -LiteralPath $sdkRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^go' } |
            Sort-Object { [version]($_.Name -replace '^go', '') } -Descending -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($latest) {
            $bin = Join-Path $latest.FullName "bin"
            if (Test-Path -LiteralPath (Join-Path $bin "go.exe")) {
                Add-ToPathFront $bin
            }
        }
    }
    foreach ($d in @("$env:ProgramFiles\nodejs", "${env:ProgramFiles(x86)}\nodejs", (Join-Path $env:LOCALAPPDATA "Programs\nodejs"))) {
        if (Test-Path -LiteralPath (Join-Path $d "npm.cmd")) {
            Add-ToPathFront $d
            return
        }
    }
}

function Test-ApiReady {
    try {
        $r = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 2
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Stop-ApiProcess {
    if ($script:ApiProcess -and -not $script:ApiProcess.HasExited) {
        Stop-Process -Id $script:ApiProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Get-Job -Name "FarmMarketAPI" -ErrorAction SilentlyContinue | Stop-Job -PassThru | Remove-Job -Force -ErrorAction SilentlyContinue
}

function Get-PidsOnPort([int]$Port) {
    $found = @()
    $pattern = ":$Port\s"
    foreach ($line in (netstat -ano 2>$null)) {
        $s = "$line"
        if ($s -notmatch $pattern -or $s -notmatch 'LISTENING') { continue }
        if ($s -match 'LISTENING\s+(\d+)\s*$') {
            $found += [int]$Matches[1]
        }
    }
    $found | Where-Object { $_ -gt 0 } | Sort-Object -Unique
}

function Clear-DevPort {
    param(
        [int]$Port,
        [string]$Label
    )
    $pids = @(Get-PidsOnPort $Port)
    if ($pids.Count -eq 0) { return }
    Write-Host "Port $Port ($Label) is busy - stopping old process(es)..." -ForegroundColor Yellow
    foreach ($procId in $pids) {
        $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
        $name = if ($p) { $p.ProcessName } else { "pid" }
        Write-Host "  -> PID $procId ($name)"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 600
}

Find-Toolchain

$missing = @()
if (-not (Get-Command go -ErrorAction SilentlyContinue)) { $missing += "go" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { $missing += "npm" }
if ($missing.Count -gt 0) {
    Write-Host "Not found: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Install Go https://go.dev/dl/ and Node https://nodejs.org/ then reopen terminal."
    exit 1
}

$goExe = (Get-Command go).Source
$npmDir = Split-Path -Parent (Get-Command npm).Source
$npmExe = Join-Path $npmDir "npm.cmd"
if (-not (Test-Path -LiteralPath $npmExe)) { $npmExe = (Get-Command npm).Source }

Write-Host "=== Farm Market (local) ===" -ForegroundColor Green
Write-Host "Go:  $goExe"
Write-Host "npm: $npmExe"
Write-Host ""

if (-not $NoFreePorts) {
    Clear-DevPort -Port 8080 -Label "API"
    Clear-DevPort -Port 5173 -Label "Vite"
}

if ($TwoWindows) {
    & $PSScriptRoot\run-local-two-windows.ps1
    exit $LASTEXITCODE
}

# --- Один терминал: API в фоне, Vite на переднем плане ---
$exe = Join-Path $root "farmmarket.exe"
Write-Host "Building API..." -ForegroundColor Yellow
Push-Location -LiteralPath $root
& $goExe build -o farmmarket.exe ./cmd/server
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "Starting API :8080..." -ForegroundColor Cyan
$script:ApiProcess = Start-Process -FilePath $exe -WorkingDirectory $root -PassThru -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    if ($script:ApiProcess.HasExited) {
        Write-Host "API process exited unexpectedly." -ForegroundColor Red
        exit 1
    }
    if (Test-ApiReady) { break }
    Start-Sleep -Milliseconds 500
}
if (-not (Test-ApiReady)) {
    Write-Host "API did not start in 60s. Check port 8080 is free." -ForegroundColor Red
    Stop-ApiProcess
    exit 1
}
Write-Host "API ready." -ForegroundColor Green

if (-not (Test-Path -LiteralPath (Join-Path $web "node_modules"))) {
    Write-Host "npm install (first run, 1-2 min)..." -ForegroundColor Yellow
    Push-Location -LiteralPath $web
    & $npmExe install
    if ($LASTEXITCODE -ne 0) { Pop-Location; Stop-ApiProcess; exit 1 }
    Pop-Location
}

Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-ApiProcess } | Out-Null

Write-Host "Starting Vite :5173..." -ForegroundColor Cyan
Write-Host "Site: $siteUrl" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop API and Vite." -ForegroundColor DarkGray
Write-Host ""

try {
    Push-Location -LiteralPath $web
    & $npmExe run dev
} finally {
    Pop-Location
    Stop-ApiProcess
}
