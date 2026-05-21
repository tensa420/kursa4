# Download from scripts/product-photo-urls.json (no API)
$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "web\public\products"
$urlFile = Join-Path $PSScriptRoot "product-photo-urls.json"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$urls = Get-Content $urlFile -Raw -Encoding UTF8 | ConvertFrom-Json
$ua = "FarmMarket/1.0"

function Test-Jpeg([string]$path) {
    if (-not (Test-Path $path)) { return $false }
    $b = [System.IO.File]::ReadAllBytes($path)
    return $b.Length -gt 10000 -and $b[0] -eq 0xFF -and $b[1] -eq 0xD8
}

$ok = 0
foreach ($prop in $urls.PSObject.Properties | Sort-Object Name) {
    $path = Join-Path $outDir ($prop.Name + ".jpg")
    Start-Sleep -Milliseconds 500
    curl.exe -sSL -L -A $ua -o $path $prop.Value 2>$null
    if (Test-Jpeg $path) { Write-Host "OK $($prop.Name)"; $ok++ }
    else { Write-Host "FAIL $($prop.Name)"; Remove-Item $path -Force -EA SilentlyContinue }
}
Write-Host "Done: $ok / $($urls.PSObject.Properties.Count)"
