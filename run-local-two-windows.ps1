# Два отдельных окна (вызывается из run-local.ps1 -TwoWindows)

$ErrorActionPreference = "Stop"

function Add-ToPathFront([string]$Dir) {
    if ($Dir -and (Test-Path -LiteralPath $Dir)) { $env:Path = "$Dir;$env:Path" }
}
foreach ($d in @("$env:ProgramFiles\Go\bin", "C:\Go\bin")) {
    if (Test-Path (Join-Path $d "go.exe")) { Add-ToPathFront $d; break }
}
if (-not (Get-Command go -EA SilentlyContinue)) {
    $sdk = Join-Path $env:USERPROFILE "sdk"
    if (Test-Path $sdk) {
        $g = Get-ChildItem $sdk -Directory | Where-Object Name -match '^go' | Sort-Object Name -Descending | Select-Object -First 1
        if ($g) { Add-ToPathFront (Join-Path $g.FullName "bin") }
    }
}
foreach ($d in @("$env:ProgramFiles\nodejs", (Join-Path $env:LOCALAPPDATA "Programs\nodejs"))) {
    if (Test-Path (Join-Path $d "npm.cmd")) { Add-ToPathFront $d; break }
}

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$web = Join-Path $root "web"

function Escape-SingleQuoted([string]$s) { $s -replace "'", "''" }

$goExe = (Get-Command go).Source
$npmDir = Split-Path -Parent (Get-Command npm).Source
$npmExe = Join-Path $npmDir "npm.cmd"
if (-not (Test-Path -LiteralPath $npmExe)) { $npmExe = (Get-Command npm).Source }

$exe = Join-Path $root "farmmarket.exe"
if (-not (Test-Path -LiteralPath $exe)) {
    Push-Location -LiteralPath $root
    & $goExe build -o farmmarket.exe ./cmd/server
    Pop-Location
}

$utf8Bom = New-Object System.Text.UTF8Encoding $true
$rq, $wq, $eq, $nq = Escape-SingleQuoted $root, Escape-SingleQuoted $web, Escape-SingleQuoted $exe, Escape-SingleQuoted $npmExe

$apiScript = Join-Path $env:TEMP "farmmarket-api.ps1"
$webScript = Join-Path $env:TEMP "farmmarket-web.ps1"

[System.IO.File]::WriteAllLines($apiScript, @(
    "`$ErrorActionPreference = 'Stop'"
    "Set-Location -LiteralPath '$rq'"
    "Write-Host 'API http://127.0.0.1:8080'"
    "& '$eq'"
), $utf8Bom)

[System.IO.File]::WriteAllLines($webScript, @(
    "`$ErrorActionPreference = 'Stop'"
    "Set-Location -LiteralPath '$wq'"
    "if (-not (Test-Path node_modules)) { & '$nq' install }"
    "Write-Host 'Vite http://127.0.0.1:5173'"
    "& '$nq' run dev"
), $utf8Bom)

$shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }

Start-Process $shell -ArgumentList "-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $apiScript
Start-Sleep -Seconds 2
Start-Process $shell -ArgumentList "-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $webScript

Write-Host "Opened 2 windows. Site: http://127.0.0.1:5173"
