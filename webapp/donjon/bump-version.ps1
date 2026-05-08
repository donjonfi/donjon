# =======================================================
# BUMP-VERSION - donjon FI
# Met à jour la version dans tous les fichiers concernés,
# puis lance sync-actions.ps1 pour propager actions.djn.
# A executer depuis webapp/donjon/
#
# Usage :
#   .\bump-version.ps1 3.3.2   # version explicite
#   .\bump-version.ps1          # mode interactif
# =======================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$NouvelleVersion = ""
)

$ErrorActionPreference = "Stop"

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
Write-Host "Bump vers $NouvelleVersion (versionNum=$versionNum, date=$dateAujourdhui)" -ForegroundColor Cyan
Write-Host ""

# --- Fichiers ---
$ActionsSource         = "../../ressources/scenarios/actions.djn"
$PackageJson           = "package.json"
$PackageLock           = "package-lock.json"
$VscodeExtPkg          = "../../ressources/extensions/vscode/donjon-fi-runner/package.json"
$VscodeExtCompagnonPkg = "../../ressources/extensions/vscode/donjon-fi-compagnon/package.json"

# 1. actions.djn
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

# 3. package.json  (1re occurrence de "version")
$contenu = Get-Content $PackageJson -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $PackageJson), $contenu, $utf8NoBom)
Write-Host "OK  $PackageJson" -ForegroundColor Green

# 4. package-lock.json  (les 2 premières occurrences de "version" concernent le projet)
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
$contenu = Get-Content $VscodeExtPkg -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $VscodeExtPkg), $contenu, $utf8NoBom)
Write-Host "OK  $VscodeExtPkg" -ForegroundColor Green

# 6. package.json extension VS Code donjon-fi-compagnon
$contenu = Get-Content $VscodeExtCompagnonPkg -Raw -Encoding UTF8
$contenu = $contenu -replace '"version": "[^"]+"', "`"version`": `"$NouvelleVersion`""
[System.IO.File]::WriteAllText((Resolve-Path $VscodeExtCompagnonPkg), $contenu, $utf8NoBom)
Write-Host "OK  $VscodeExtCompagnonPkg" -ForegroundColor Green

# 7. Synchro actions.djn → creer / jouer / scenario_actions.ts
Write-Host ""
Write-Host "Synchro actions..." -ForegroundColor Cyan
& "$PSScriptRoot/sync-actions.ps1"

Write-Host ""
Write-Host "Version $NouvelleVersion appliquee." -ForegroundColor Green
