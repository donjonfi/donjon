# =======================================================
# BUILD EXTENSION VS CODE - donjon-fi-compagnon
# Script situe a la racine du repo : <repo>/scripts/build-extension-compagnon.ps1
# Il se positionne automatiquement sur <repo>/webapp/donjon/,
# il peut donc etre invoque depuis n'importe ou :
#   .\scripts\build-extension-compagnon.ps1   (depuis la racine du repo)
#   .\build-extension-compagnon.ps1           (depuis <repo>/scripts/)
#
# Etapes :
#   1. Compile l'app Angular donjon-compagnon (configuration bundle)
#   2. Synchronise le bundle vers media/compagnon-app/ de l'extension
#   3. Synchronise le actions.djn par defaut vers media/ de l'extension
#   4. Compile le TypeScript de l'extension VS Code
#   5. Empaquette le .vsix avec @vscode/vsce
# =======================================================

$ErrorActionPreference = "Stop"

# Ancrage du repertoire de travail sur <repo>/webapp/donjon/.
# $PSScriptRoot = <repo>/scripts/  ->  parent = <repo>  ->  +webapp/donjon
Set-Location (Join-Path (Split-Path -Parent $PSScriptRoot) "webapp/donjon")

# Chemin vers l'extension VS Code (relatif a webapp/donjon/)
$ExtensionDir = "../../ressources/extensions/vscode/donjon-fi-compagnon"

if (-not (Test-Path $ExtensionDir)) {
    Write-Host "ERREUR : extension introuvable a '$ExtensionDir' (relatif a $(Get-Location))." -ForegroundColor Red
    exit 1
}

# =======================================================
# 1. BUILD COMPAGNON ANGULAR (configuration bundle)
# =======================================================
Write-Host "`n[1/5] Compagnon Angular - compilation (configuration bundle)..." -ForegroundColor Cyan
Remove-Item "./dist/donjon-compagnon-bundle" -Force -Recurse -ErrorAction Ignore
ng build donjon-compagnon --configuration=bundle

# =======================================================
# 2. SYNC VERS media/compagnon-app/ DE L'EXTENSION
# =======================================================
Write-Host "`n[2/5] Compagnon - sync vers media/compagnon-app/..." -ForegroundColor Cyan
# Le script sync-compagnon.js est situe a <repo>/scripts/, soit ../../scripts/ depuis webapp/donjon/.
node ../../scripts/sync-compagnon.js

# =======================================================
# 3. SYNC actions.djn par defaut VERS media/ DE L'EXTENSION
# =======================================================
Write-Host "`n[3/5] Extension - sync de actions.djn par defaut..." -ForegroundColor Cyan
# Source canonique : <repo>/ressources/scenarios/actions.djn
# Destination : <repo>/ressources/extensions/vscode/donjon-fi-compagnon/media/actions.djn
$ActionsSrc = "../../ressources/scenarios/actions.djn"
$ActionsDst = "$ExtensionDir/media/actions.djn"
if (-not (Test-Path $ActionsSrc)) {
    Write-Host "ERREUR : actions.djn introuvable a '$ActionsSrc' (relatif a $(Get-Location))." -ForegroundColor Red
    exit 1
}
Copy-Item -Path $ActionsSrc -Destination $ActionsDst -Force
Write-Host "      Copie : $ActionsSrc -> $ActionsDst" -ForegroundColor DarkGray

# =======================================================
# 4. COMPILATION TS DE L'EXTENSION
# =======================================================
Write-Host "`n[4/5] Extension - npm install (si besoin) + tsc..." -ForegroundColor Cyan
Push-Location $ExtensionDir
try {
    if (-not (Test-Path "./node_modules")) {
        Write-Host "      node_modules absent - npm install..." -ForegroundColor DarkGray
        npm install
    }
    npm run compile
} finally {
    Pop-Location
}

# =======================================================
# 5. PACKAGING .vsix (vsce)
# =======================================================
Write-Host "`n[5/5] Extension - packaging .vsix (vsce)..." -ForegroundColor Cyan
Push-Location $ExtensionDir
try {
    # Nettoyage des anciens .vsix
    Get-ChildItem "*.vsix" -ErrorAction Ignore | Remove-Item -Force
    # --no-dependencies : on n'utilise pas npm runtime deps cote extension
    npx --yes @vscode/vsce package --no-dependencies
} finally {
    Pop-Location
}

# =======================================================
# RESULTAT
# =======================================================
$Vsix = Get-ChildItem "$ExtensionDir/*.vsix" -ErrorAction Ignore | Select-Object -First 1
if ($Vsix) {
    Write-Host "`nPRET ! .vsix produit :" -ForegroundColor Green
    Write-Host "  $($Vsix.FullName)" -ForegroundColor Green
    Write-Host "`nInstallation locale :" -ForegroundColor DarkGray
    Write-Host "  code --install-extension `"$($Vsix.FullName)`"" -ForegroundColor DarkGray
} else {
    Write-Host "`nATTENTION : aucun .vsix trouve apres vsce package." -ForegroundColor Yellow
    exit 1
}
