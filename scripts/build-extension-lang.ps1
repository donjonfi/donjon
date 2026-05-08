# =======================================================
# BUILD EXTENSION VS CODE - donjon-fi-lang
# Script situe a la racine du repo : <repo>/scripts/build-extension-lang.ps1
# Il se positionne automatiquement sur <repo>, il peut donc etre invoque
# depuis n'importe ou :
#   .\scripts\build-extension-lang.ps1   (depuis la racine du repo)
#   .\build-extension-lang.ps1           (depuis <repo>/scripts/)
#
# Etapes :
#   1. Compile le TypeScript de l'extension VS Code
#   2. Empaquette le .vsix avec @vscode/vsce
# =======================================================

$ErrorActionPreference = "Stop"

# Ancrage du repertoire de travail sur <repo>.
# $PSScriptRoot = <repo>/scripts/  ->  parent = <repo>
Set-Location (Split-Path -Parent $PSScriptRoot)

# Chemin vers l'extension VS Code (relatif a la racine du repo)
$ExtensionDir = "ressources/extensions/vscode/donjon-fi-lang"

if (-not (Test-Path $ExtensionDir)) {
    Write-Host "ERREUR : extension introuvable a '$ExtensionDir' (relatif a $(Get-Location))." -ForegroundColor Red
    exit 1
}

# =======================================================
# 1. COMPILATION TS DE L'EXTENSION
# =======================================================
Write-Host "`n[1/2] Extension - npm install (si besoin) + tsc..." -ForegroundColor Cyan
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
# 2. PACKAGING .vsix (vsce)
# =======================================================
Write-Host "`n[2/2] Extension - packaging .vsix (vsce)..." -ForegroundColor Cyan
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
