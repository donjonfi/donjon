# =======================================================
# BUILD ALL - donjon FI
# Script situe a la racine du repo : <repo>/scripts/build-all.ps1
# Il se positionne automatiquement sur <repo>/webapp/donjon/,
# il peut donc etre invoque depuis n'importe ou :
#   .\scripts\build-all.ps1   (depuis la racine du repo)
#   .\build-all.ps1           (depuis <repo>/scripts/)
# =======================================================

$ErrorActionPreference = "Stop"

# Ancrage du repertoire de travail sur <repo>/webapp/donjon/.
# $PSScriptRoot = <repo>/scripts/  ->  parent = <repo>  ->  +webapp/donjon
Set-Location (Join-Path (Split-Path -Parent $PSScriptRoot) "webapp/donjon")

# Vérifier s'il y a des modifications non commitées
if (git status --porcelain) {
    Write-Host "`nATTENTION : des modifications non commitees ont ete detectees :" -ForegroundColor Yellow
    git status --short
    $reponse = Read-Host "`nContinuer quand meme ? (o/N)"
    if ($reponse -ne "o" -and $reponse -ne "O") {
        Write-Host "Build annule." -ForegroundColor Red
        exit 1
    }
}

# Chemins vers le site et les ressources
$SiteBuilds    = "../../../site-donjon-fi/assets/builds"
$SiteV3        = "../../../site-donjon-fi/v3"
$SiteBackup    = "../../../site-donjon-fi/backup"
$Scenarios     = "../../../scenarios_donjon"
$HtaccessCreer = "../../ressources/conf_serveurs/apache/v3/creer/.htaccess"
$HtaccessJouer = "../../ressources/conf_serveurs/apache/v3/jouer/.htaccess"

# =======================================================
# HELPERS
# =======================================================

function Fix-InlinedHtml([string]$path) {
    $html = Get-Content $path -Raw
    $html = $html -replace '<style media="print">', '<style>'
    $html = $html -replace '(?s)<noscript><style>.*?</style></noscript>', ''
    Set-Content $path $html -NoNewline
}

function Build-GulpSections {
    param([string]$SiteBuilds, [string]$Scenarios)

    $BrancheOrigine = git rev-parse --abbrev-ref HEAD
    git checkout gulp-single-file
    git merge master --no-edit

    try {

    # =======================================================
    # 1. PLAYER BUNDLE (template pour bouton telecharger mon jeu)
    # =======================================================
    Write-Host "`n[1/7] Player bundle - generation bundle actions..." -ForegroundColor Cyan
    node generate-jouer-bundle.js

    Write-Host "[1/7] Player bundle - compilation..." -ForegroundColor Cyan
    Remove-Item "./dist/donjon-jouer-bundle" -Force -Recurse -ErrorAction Ignore
    ng build donjon-jouer --configuration=donjon-jouer-bundle

    Write-Host "[1/7] Player bundle - inline CSS/JS (gulp)..." -ForegroundColor Cyan
    $SingleDistBundle = "./single-dist/donjon-jouer-bundle"
    Remove-Item $SingleDistBundle -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path "./dist/donjon-jouer-bundle/browser/assets" -Destination "$SingleDistBundle/assets" -Recurse
    Copy-Item -Path "./dist/donjon-jouer-bundle/browser/media"  -Destination "$SingleDistBundle/media"  -Recurse -ErrorAction Ignore
    npx gulp jouer-bundle
    Fix-InlinedHtml "$SingleDistBundle/index.html"

    Write-Host "[1/7] Player bundle - copie vers extension VS Code donjon-fi-runner..." -ForegroundColor Cyan
    $VsCodeRunner = "../../ressources/extensions/vscode/donjon-fi-runner/media"
    New-Item -ItemType Directory -Force -Path $VsCodeRunner | Out-Null
    Copy-Item "$SingleDistBundle/index.html" -Destination "$VsCodeRunner/player.html" -Force

    Write-Host "[1/7] Player bundle - generation template TS pour donjon-creer..." -ForegroundColor Cyan
    node generate-jouer-one-template.js

    # =======================================================
    # 2. PLAYER ONE (deprecated - single file)
    # =======================================================
    Write-Host "`n[2/7] Player one - compilation..." -ForegroundColor Cyan
    Remove-Item "./dist/donjon-one" -Force -Recurse -ErrorAction Ignore
    ng build donjon-jouer --configuration=one

    Write-Host "[2/7] Player one - inline CSS/JS (gulp)..." -ForegroundColor Cyan
    $SingleDistOne = "./single-dist/donjon-one"
    Remove-Item $SingleDistOne -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path "./dist/donjon-one/browser/assets" -Destination "$SingleDistOne/assets" -Recurse
    Copy-Item -Path "./dist/donjon-one/browser/media"  -Destination "$SingleDistOne/media"  -Recurse
    npx gulp
    Fix-InlinedHtml "$SingleDistOne/index.html"

    Write-Host "[2/7] Player one - pack zip..." -ForegroundColor Cyan
    $TempOne = "$SiteBuilds/donjon-temp"
    Remove-Item "$SiteBuilds/donjon-one-v3.zip" -ErrorAction Ignore
    Remove-Item $TempOne -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path $SingleDistOne -Destination $TempOne -Recurse
    Remove-Item "$TempOne/assets/jeux/*.djn"
    Copy-Item "$Scenarios/exemple.djn" -Destination "$TempOne/assets/jeux/jeu.djn"
    Remove-Item "$TempOne/assets/ressources/oursblanc" -Force -Recurse -ErrorAction Ignore
    Remove-Item "$TempOne/assets/ressources/swiart2"   -Force -Recurse -ErrorAction Ignore
    Compress-Archive "$TempOne/*" -DestinationPath "$SiteBuilds/donjon-one-v3.zip"
    Remove-Item $TempOne -Force -Recurse -ErrorAction Ignore

    # =======================================================
    # 3. EDITEUR STANDALONE
    # =======================================================
    Write-Host "`n[3/7] Editeur standalone - generation bundle modeles..." -ForegroundColor Cyan
    node generate-modeles-bundle.js

    Write-Host "[3/7] Editeur standalone - compilation..." -ForegroundColor Cyan
    Remove-Item "./dist/donjon-creer-one" -Force -Recurse -ErrorAction Ignore
    ng build donjon-creer --configuration=one

    Write-Host "[3/7] Editeur standalone - inline CSS/JS (gulp)..." -ForegroundColor Cyan
    $SingleDistCreer = "./single-dist/donjon-creer-one"
    Remove-Item $SingleDistCreer -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path "./dist/donjon-creer-one/browser/assets" -Destination "$SingleDistCreer/assets" -Recurse
    Copy-Item -Path "./dist/donjon-creer-one/browser/media"  -Destination "$SingleDistCreer/media"  -Recurse -ErrorAction Ignore
    npx gulp creer-one
    Fix-InlinedHtml "$SingleDistCreer/index.html"

    Write-Host "[3/7] Editeur standalone - pack zip..." -ForegroundColor Cyan
    $TempCreer = "$SiteBuilds/donjon-creer-temp"
    Remove-Item "$SiteBuilds/donjon-creer-one-v3.zip" -ErrorAction Ignore
    Remove-Item $TempCreer -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path $SingleDistCreer -Destination $TempCreer -Recurse
    Remove-Item "$TempCreer/assets/ressources/oursblanc" -Force -Recurse -ErrorAction Ignore
    Remove-Item "$TempCreer/assets/ressources/swiart2"   -Force -Recurse -ErrorAction Ignore
    Compress-Archive "$TempCreer/*" -DestinationPath "$SiteBuilds/donjon-creer-one-v3.zip"
    Remove-Item $TempCreer -Force -Recurse -ErrorAction Ignore

    } finally {
        Write-Host "`n[fin gulp] Retour sur la branche '$BrancheOrigine'..." -ForegroundColor Cyan
        git checkout $BrancheOrigine
    }
}

# =======================================================
# EXECUTION
# =======================================================

Build-GulpSections -SiteBuilds $SiteBuilds -Scenarios $Scenarios

# =======================================================
# 4. PLAYER MULTI (serveur)
# =======================================================
Write-Host "`n[4/7] Player multi - compilation..." -ForegroundColor Cyan
Remove-Item "./dist/donjon-jouer" -Force -Recurse -ErrorAction Ignore
ng build donjon-jouer --configuration=multi --base-href=/v3/jouer/

# =======================================================
# 5. EDITEUR WEB CLASSIQUE (serveur)
# =======================================================
Write-Host "`n[5/7] Editeur web - compilation..." -ForegroundColor Cyan
Remove-Item "./dist/donjon-creer" -Force -Recurse -ErrorAction Ignore
ng build donjon-creer --base-href=/v3/creer/

# =======================================================
# 6. EXTENSION VS CODE - donjon-fi-compagnon
# =======================================================
Write-Host "`n[6/7] Extension VS Code compagnon - build + packaging..." -ForegroundColor Cyan
Push-Location
try { & "$PSScriptRoot/build-extension-compagnon.ps1" } finally { Pop-Location }

# =======================================================
# 7. EXTENSION VS CODE - donjon-fi-lang
# =======================================================
Write-Host "`n[7/7] Extension VS Code lang - build + packaging..." -ForegroundColor Cyan
Push-Location
try { & "$PSScriptRoot/build-extension-lang.ps1" } finally { Pop-Location }

# =======================================================
# 8. COPIES VERS SITE (conditionnel)
# =======================================================
if (Test-Path $SiteV3) {
    Write-Host "`n[8] Copies vers site donjon.fi..." -ForegroundColor Cyan

    # Pack donjon-jouer multi
    Write-Host "  Pack donjon-jouer multi..."
    $DonjonDir = "$SiteBuilds/donjon"
    Remove-Item "$SiteBuilds/donjon-jouer-v3.zip" -ErrorAction Ignore
    Remove-Item $DonjonDir -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path "./dist/donjon-jouer/browser" -Destination $DonjonDir -Recurse
    $indexContent = Get-Content -Path "$DonjonDir/index.html" -Raw
    $indexContent = $indexContent -replace '/v3/jouer/', '/donjon/'
    Set-Content -Path "$DonjonDir/index.html" -Value $indexContent
    Remove-Item "$DonjonDir/assets/jeux/*.djn"
    Copy-Item "$Scenarios/exemple.djn" -Destination "$DonjonDir/assets/jeux/exemple.djn"
    Remove-Item "$DonjonDir/assets/ressources/oursblanc" -Force -Recurse -ErrorAction Ignore
    Remove-Item "$DonjonDir/assets/ressources/swiart2"   -Force -Recurse -ErrorAction Ignore
    Compress-Archive -Path $DonjonDir -DestinationPath "$SiteBuilds/donjon-jouer-v3.zip"
    Remove-Item $DonjonDir -Force -Recurse -ErrorAction Ignore

    # Copie creer + jouer vers site
    Write-Host "  Copie creer + jouer vers site..."
    Remove-Item "$SiteV3/creer-next" -Force -Recurse -ErrorAction Ignore
    Remove-Item "$SiteV3/jouer-next" -Force -Recurse -ErrorAction Ignore
    Copy-Item -Path "./dist/donjon-creer/browser" -Destination "$SiteV3/creer-next" -Recurse
    Copy-Item -Path "./dist/donjon-jouer/browser" -Destination "$SiteV3/jouer-next" -Recurse
    Copy-Item $HtaccessCreer -Destination "$SiteV3/creer-next/.htaccess"
    Copy-Item $HtaccessJouer -Destination "$SiteV3/jouer-next/.htaccess"

    # Backups
    Write-Host "  Backups..."
    Remove-Item "$SiteBackup/donjon-creer-v3.zip" -ErrorAction Ignore
    Remove-Item "$SiteBackup/donjon-jouer-v3.zip" -ErrorAction Ignore
    Compress-Archive -Path ./dist/donjon-creer/browser -DestinationPath "$SiteBackup/donjon-creer-v3.zip"
    Compress-Archive -Path ./dist/donjon-jouer/browser -DestinationPath "$SiteBackup/donjon-jouer-v3.zip"
} else {
    Write-Host "`n[8] Site donjon.fi introuvable ($SiteV3) - copies ignorees." -ForegroundColor Yellow
}

# =======================================================
Write-Host "`nPRET !" -ForegroundColor Green
