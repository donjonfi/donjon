# =======================================================
# SYNC-ACTIONS - donjon FI
# Script situe a la racine du repo : <repo>/scripts/sync-actions.ps1
# Il se positionne automatiquement sur <repo>/webapp/donjon/,
# il peut donc etre invoque depuis n'importe ou :
#   .\scripts\sync-actions.ps1   (depuis la racine du repo)
#   .\sync-actions.ps1           (depuis <repo>/scripts/)
#
# Propage ressources/scenarios/actions.djn vers :
#   - projects/donjon-creer/src/assets/modeles/actions.djn
#   - projects/donjon-jouer/src/assets/modeles/actions.djn
#   - projects/donjon/src/lib/tests/scenario_actions.ts
# =======================================================

$ErrorActionPreference = "Stop"

# Ancrage du repertoire de travail sur <repo>/webapp/donjon/.
# $PSScriptRoot = <repo>/scripts/  ->  parent = <repo>  ->  +webapp/donjon
Set-Location (Join-Path (Split-Path -Parent $PSScriptRoot) "webapp/donjon")

$Source     = "../../ressources/scenarios/actions.djn"
$Creer      = "projects/donjon-creer/src/assets/modeles/actions.djn"
$Jouer      = "projects/donjon-jouer/src/assets/modeles/actions.djn"
$ScenarioTs = "projects/donjon/src/lib/tests/scenario_actions.ts"

if (-not (Test-Path $Source)) {
    Write-Host "ERREUR : fichier source introuvable : $Source" -ForegroundColor Red
    exit 1
}

# 1. Copie vers donjon-creer
Copy-Item $Source $Creer -Force
Write-Host "OK  $Creer" -ForegroundColor Green

# 2. Copie vers donjon-jouer
Copy-Item $Source $Jouer -Force
Write-Host "OK  $Jouer" -ForegroundColor Green

# 3. Generation de scenario_actions.ts
$contenu = Get-Content $Source -Raw -Encoding UTF8
$ts = "`nexport const actions = ``$contenu``;"
[System.IO.File]::WriteAllText(
    (Resolve-Path $ScenarioTs),
    $ts,
    [System.Text.Encoding]::UTF8
)
Write-Host "OK  $ScenarioTs" -ForegroundColor Green

Write-Host "`nSync termine." -ForegroundColor Cyan
