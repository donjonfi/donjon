# =======================================================
# BUMP-VERSION - donjon FI (global)
# Script situe a <repo>/scripts/bump-version.ps1
# Lance le bump de version dans donjon3-git (webapp/donjon/bump-version.ps1),
# puis met a jour la page d'accueil de site-donjon-fi (sibling du repo).
#
# Le script peut etre invoque depuis n'importe ou :
#   .\scripts\bump-version.ps1 3.3.2   # depuis la racine du repo
#   .\bump-version.ps1                 # depuis <repo>/scripts/, mode interactif
#
# Usage :
#   bump-version.ps1 3.3.2   # version explicite
#   bump-version.ps1         # mode interactif
# =======================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$NouvelleVersion = ""
)

$ErrorActionPreference = "Stop"

# Chemins ancres sur $PSScriptRoot = <repo>/scripts/
$WebappDonjonDir = Join-Path $PSScriptRoot "../webapp/donjon"
$BumpInnerScript = Join-Path $WebappDonjonDir "bump-version.ps1"
$SiteDonjonFiDir = Join-Path $PSScriptRoot "../../site-donjon-fi"
$SiteSyncScript  = Join-Path $SiteDonjonFiDir "sync-version.ps1"

# 1. Bump version (donjon3-git)
Write-Host ""
Write-Host "[1/2] Bump version donjon3-git..." -ForegroundColor Cyan
$scriptArgs = @()
if ($NouvelleVersion -ne "") { $scriptArgs = @($NouvelleVersion) }
Push-Location $WebappDonjonDir
try {
    & $BumpInnerScript @scriptArgs
} finally {
    Pop-Location
}

# 2. Sync site donjon.fi
Write-Host ""
Write-Host "[2/2] Sync site donjon.fi..." -ForegroundColor Cyan
if (-not (Test-Path $SiteDonjonFiDir)) {
    Write-Host "  Repertoire introuvable : $SiteDonjonFiDir - sync ignore." -ForegroundColor Yellow
} else {
    Push-Location $SiteDonjonFiDir
    try {
        & $SiteSyncScript
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Termine." -ForegroundColor Green
