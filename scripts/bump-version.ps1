# =======================================================
# BUMP-VERSION - donjon FI
# Script situe a la racine du repo : <repo>/scripts/bump-version.ps1
# Il se positionne automatiquement sur <repo>/webapp/donjon/,
# il peut donc etre invoque depuis n'importe ou :
#   .\scripts\bump-version.ps1 3.3.2   (depuis la racine du repo, version explicite)
#   .\scripts\bump-version.ps1          (depuis la racine du repo, mode interactif)
#   .\bump-version.ps1                  (depuis <repo>/scripts/, mode interactif)
#
# Met a jour la version dans tous les fichiers concernes :
#   - projects/donjon/src/lib/models/commun/constantes.ts
#   - package.json + package-lock.json (webapp/donjon/)
#   - ressources/extensions/vscode/donjon-fi-runner/package.json
#   - ressources/extensions/vscode/donjon-fi-compagnon/package.json
#   - ressources/extensions/vscode/donjon-fi-lang/package.json
#   - ressources/scenarios/actions.djn (entete -- Version: YYYY-MM-DD-VVVVV)
# Puis lance sync-actions.ps1 pour propager actions.djn (creer / jouer / scenario_actions.ts).
# Enfin, synchronise la page d'accueil de site-donjon-fi (sibling du repo) si present.
# =======================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$NouvelleVersion = ""
)

$ErrorActionPreference = "Stop"

# Ancrage du repertoire de travail sur <repo>/webapp/donjon/.
# $PSScriptRoot = <repo>/scripts/  ->  parent = <repo>  ->  +webapp/donjon
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $RepoRoot "webapp/donjon")

$Constantes = "projects/donjon/src/lib/models/commun/constantes.ts"

# --- Mode interactif si pas de version fournie ---
if ($NouvelleVersion -eq "") {
    $contenuConst = Get-Content $Constantes -Raw -Encoding UTF8
    if ($contenuConst -match 'export const version = "(\d+)\.(\d+)\.(\d+)"') {
        $curMajor = [int]$Matches[1]
        $curMinor = [int]$Matches[2]
        $curPatch = [int]$Matches[3]
    } else {
        Write-Host "ERREUR : impossible de lire la version actuelle dans $Constantes" -ForegroundColor Red
        exit 1
    }
    $versionActuelle = "$curMajor.$curMinor.$curPatch"
    $choixPatch = "$curMajor.$curMinor.$($curPatch + 1)"
    $choixMinor = "$curMajor.$($curMinor + 1).0"

    Write-Host ""
    Write-Host "Version actuelle : $versionActuelle" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] Patch  -> $choixPatch"
    Write-Host "  [2] Minor  -> $choixMinor"
    Write-Host "  [3] Manuelle"
    Write-Host ""
    $choix = Read-Host "Choix (1/2/3)"

    switch ($choix) {
        "1" { $NouvelleVersion = $choixPatch }
        "2" { $NouvelleVersion = $choixMinor }
        "3" {
            $NouvelleVersion = Read-Host "Nouvelle version (x.y.z)"
        }
        default {
            Write-Host "Choix invalide." -ForegroundColor Red
            exit 1
        }
    }
}

# --- Validation format x.y.z ---
if ($NouvelleVersion -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "ERREUR : format de version invalide '$NouvelleVersion' (attendu : x.y.z)" -ForegroundColor Red
    exit 1
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

$parts = $NouvelleVersion -split '\.'
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]
$versionNum = $major * 10000 + $minor * 100 + $patch
$dateAujourdhui = Get-Date -Format "yyyy-MM-dd"

Write-Host ""
Write-Host "[1/3] Bump vers $NouvelleVersion (versionNum=$versionNum, date=$dateAujourdhui)" -ForegroundColor Cyan
Write-Host ""

# --- Fichiers ---
$ActionsSource         = "../../ressources/scenarios/actions.djn"
$PackageJson           = "package.json"
$PackageLock           = "package-lock.json"
$VscodeExtRunnerPkg    = "../../ressources/extensions/vscode/donjon-fi-runner/package.json"
$VscodeExtCompagnonPkg = "../../ressources/extensions/vscode/donjon-fi-compagnon/package.json"
$VscodeExtLangPkg      = "../../ressources/extensions/vscode/donjon-fi-lang/package.json"

# 1. actions.djn (entete -- Version: YYYY-MM-DD-VVVVV)
$contenu = Get-Content $ActionsSource -Raw -Encoding UTF8
$contenu = $contenu -replace '-- Version: [\d-]+', "-- Version: $dateAujourdhui-$versionNum"
[System.IO.File]::WriteAllText((Resolve-Path $ActionsSource), $contenu, $utf8NoBom)
Write-Host "OK  $ActionsSource" -ForegroundColor Green

# 2. constantes.ts
$contenu = Get-Content $Constantes -Raw -Encoding UTF8
$contenu = $contenu -replace 'export const version = "[^"]+"', "export const version = `"$NouvelleVersion`""
$contenu = $contenu -replace 'export const versionNum = \d+;', "export const versionNum = $versionNum;"
[System.IO.File]::WriteAllText((Resolve-Path $Constantes), $contenu, $utf8NoBom)
Write-Host "OK  $Constantes" -ForegroundColor Green

# 3. package.json (1re occurrence de "version")
$contenu = Get-Content $PackageJson -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $PackageJson), $contenu, $utf8NoBom)
Write-Host "OK  $PackageJson" -ForegroundColor Green

# 4. package-lock.json (les 2 premieres occurrences de "version" concernent le projet)
$contenu = Get-Content $PackageLock -Raw -Encoding UTF8
$script:compteurLock = 0
$contenu = [regex]::Replace($contenu, '"version": "[^"]+"', {
    param($m)
    if ($script:compteurLock -lt 2) {
        $script:compteurLock++
        "`"version`": `"$NouvelleVersion`""
    } else {
        $m.Value
    }
})
[System.IO.File]::WriteAllText((Resolve-Path $PackageLock), $contenu, $utf8NoBom)
Write-Host "OK  $PackageLock" -ForegroundColor Green

# 5. package.json extension VS Code donjon-fi-runner
$contenu = Get-Content $VscodeExtRunnerPkg -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $VscodeExtRunnerPkg), $contenu, $utf8NoBom)
Write-Host "OK  $VscodeExtRunnerPkg" -ForegroundColor Green

# 6. package.json extension VS Code donjon-fi-compagnon
$contenu = Get-Content $VscodeExtCompagnonPkg -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $VscodeExtCompagnonPkg), $contenu, $utf8NoBom)
Write-Host "OK  $VscodeExtCompagnonPkg" -ForegroundColor Green

# 7. package.json extension VS Code donjon-fi-lang
$contenu = Get-Content $VscodeExtLangPkg -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $VscodeExtLangPkg), $contenu, $utf8NoBom)
Write-Host "OK  $VscodeExtLangPkg" -ForegroundColor Green

# --- 2/3 : Synchro actions.djn -> creer / jouer / scenario_actions.ts ---
Write-Host ""
Write-Host "[2/3] Synchro actions..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "sync-actions.ps1")

# --- 3/3 : Sync site donjon.fi (sibling du repo, optionnel) ---
$SiteDonjonFiDir = Join-Path $RepoRoot "../site-donjon-fi"
$SiteSyncScript  = Join-Path $SiteDonjonFiDir "sync-version.ps1"

Write-Host ""
Write-Host "[3/3] Sync site donjon.fi..." -ForegroundColor Cyan
if (-not (Test-Path $SiteDonjonFiDir)) {
    Write-Host "  Repertoire introuvable : $SiteDonjonFiDir - sync ignore." -ForegroundColor Yellow
} elseif (-not (Test-Path $SiteSyncScript)) {
    Write-Host "  Script introuvable : $SiteSyncScript - sync ignore." -ForegroundColor Yellow
} else {
    Push-Location $SiteDonjonFiDir
    try {
        & $SiteSyncScript
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Version $NouvelleVersion appliquee." -ForegroundColor Green
