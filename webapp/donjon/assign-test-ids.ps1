# =======================================================
# ASSIGN-TEST-IDS - donjon FI
# Ajoute un identifiant unique [F###-T###] au debut de la
# description de chaque test (it / xit / fit) dans
# projects/donjon/src/lib/tests/*.spec.ts.
#
# - Idempotent : un test deja tague est preserve tel quel.
# - Re-executable : seuls les nouveaux tests recoivent un ID.
# - Source de verite = contenu du fichier (les tags
#   existants determinent le fileId du fichier).
# - Registre : test-ids-registry.json (mapping fichier->ID
#   et nextFileId pour les futurs fichiers).
#
# A executer depuis webapp/donjon/
#
# Usage :
#   .\assign-test-ids.ps1            # applique les changements
#   .\assign-test-ids.ps1 -DryRun    # simule sans rien ecrire
# =======================================================

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$TestsDir     = "projects/donjon/src/lib/tests"
$RegistryPath = "test-ids-registry.json"

if (-not (Test-Path $TestsDir)) {
    Write-Host "ERREUR : dossier tests introuvable : $TestsDir" -ForegroundColor Red
    exit 1
}

# --- Charger le registre ---
$filesMap   = @{}
$nextFileId = 1

if (Test-Path $RegistryPath) {
    try {
        $registry = Get-Content $RegistryPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($registry.nextFileId) { $nextFileId = [int]$registry.nextFileId }
        if ($registry.files) {
            foreach ($prop in $registry.files.PSObject.Properties) {
                $filesMap[$prop.Name] = [int]$prop.Value
            }
        }
    } catch {
        Write-Host "AVERTISSEMENT : registre illisible, recreation. ($_)" -ForegroundColor Yellow
    }
}

function Pad3([int]$n) { return $n.ToString("000") }

# --- Pattern test : it("..."), xit('...'), fit(`...`) ---
# Capture : 1=fn, 2=quote, 3=description
$Pattern = '\b(x?it|fit)\s*\(\s*([''"`])((?:\\.|(?!\2).)*?)\2'

$specFiles    = Get-ChildItem -Path $TestsDir -Filter "*.spec.ts" -File | Sort-Object Name
$totalAdded   = 0
$filesChanged = 0
$utf8NoBom    = New-Object System.Text.UTF8Encoding $false

foreach ($f in $specFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $key     = $f.Name

    # Tags existants dans le fichier (source de verite)
    $existing = [regex]::Matches($content, '\[F(\d+)-T(\d+)\]')

    if ($existing.Count -gt 0) {
        $fileId = [int]$existing[0].Groups[1].Value
        # Coherence : tous les tags du fichier doivent partager le meme fileId
        foreach ($m in $existing) {
            if ([int]$m.Groups[1].Value -ne $fileId) {
                Write-Host ("AVERTISSEMENT : {0} contient des fileId mixtes (F{1} et F{2})" -f $f.Name, $fileId, $m.Groups[1].Value) -ForegroundColor Yellow
            }
        }
        $filesMap[$key] = $fileId
        if ($fileId -ge $nextFileId) { $nextFileId = $fileId + 1 }
    } elseif ($filesMap.ContainsKey($key)) {
        $fileId = $filesMap[$key]
    } else {
        $fileId = $nextFileId
        $nextFileId++
        $filesMap[$key] = $fileId
    }

    $fileIdStr = Pad3 $fileId

    # Plus grand testId deja attribue dans CE fichier
    $maxT = 0
    foreach ($m in $existing) {
        if ([int]$m.Groups[1].Value -eq $fileId) {
            $t = [int]$m.Groups[2].Value
            if ($t -gt $maxT) { $maxT = $t }
        }
    }

    # Etat partage avec le MatchEvaluator
    $script:nextT       = $maxT + 1
    $script:fileIdStr   = $fileIdStr
    $script:addedCount  = 0

    $evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        $fn    = $match.Groups[1].Value
        $quote = $match.Groups[2].Value
        $desc  = $match.Groups[3].Value
        if ($desc -match '^\[F\d+-T\d+\]') {
            return $match.Value
        }
        $tStr = $script:nextT.ToString("000")
        $script:nextT++
        $script:addedCount++
        $newDesc = "[F$($script:fileIdStr)-T$tStr] $desc"
        return "$fn($quote$newDesc$quote"
    }

    $updated = [regex]::Replace($content, $Pattern, $evaluator)

    if ($script:addedCount -gt 0) {
        if (-not $DryRun) {
            [System.IO.File]::WriteAllText($f.FullName, $updated, $utf8NoBom)
        }
        $tag = if ($DryRun) { "[dry-run]" } else { "[ok]" }
        Write-Host ("  {0} F{1}  +{2,3} test(s)  {3}" -f $tag, $fileIdStr, $script:addedCount, $f.Name) -ForegroundColor Green
        $totalAdded += $script:addedCount
        $filesChanged++
    }
}

# --- Sauvegarder le registre ---
$filesObj = [PSCustomObject]@{}
foreach ($k in ($filesMap.Keys | Sort-Object)) {
    $filesObj | Add-Member -NotePropertyName $k -NotePropertyValue $filesMap[$k]
}
$out = [PSCustomObject]@{
    nextFileId = $nextFileId
    files      = $filesObj
}
$json = $out | ConvertTo-Json -Depth 5

if (-not $DryRun) {
    $absRegistryPath = Join-Path (Get-Location).Path $RegistryPath
    [System.IO.File]::WriteAllText($absRegistryPath, $json + "`r`n", $utf8NoBom)
}

Write-Host ""
if ($DryRun) {
    Write-Host ("[dry-run] {0} nouveau(x) tag(s) seraient ajoutes dans {1} fichier(s)." -f $totalAdded, $filesChanged) -ForegroundColor Cyan
} else {
    Write-Host ("Termine. {0} nouveau(x) tag(s) ajoute(s) dans {1} fichier(s)." -f $totalAdded, $filesChanged) -ForegroundColor Cyan
    Write-Host ("Registre : {0}" -f $RegistryPath) -ForegroundColor Cyan
}
