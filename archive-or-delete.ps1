param(
  [ValidateSet("Archive","Delete")]
  [string]$Mode = "Archive",
  [string]$InventoryCsv = "tools/scan/file-inventory.csv",
  [string]$UnimportedJson = "tools/scan/.unimported.json",
  [switch]$DryRun
)

# TTQuotes Cleanup Script (PS 5.1 compatible, fixed)
# - No ternary operator; UTF-8 BOM recommended.
# - Fix: do NOT call "git rm --cached" for untracked/moved files.
# - Fix: gracefully skip missing files (already moved) without error.

$ErrorActionPreference = "Stop"

function Normalize-Path([string]$p) {
  return $p.Replace('\','/').ToLower()
}

# --- Load inventory ---
if (-not (Test-Path $InventoryCsv)) {
  throw "Inventory CSV not found: $InventoryCsv. Please run the scan first."
}
$inventory = Import-Csv $InventoryCsv
$repoOnly = @()
foreach ($row in $inventory) {
  if ($row.location -eq 'RepoOnly') { $repoOnly += (Normalize-Path $row.path) }
}

# --- Load optional unimported ---
$unimported = @()
if (Test-Path $UnimportedJson) {
  try {
    $raw = Get-Content $UnimportedJson -Raw
    $json = $raw | ConvertFrom-Json
    if ($json -and ($json.PSObject.Properties.Name -contains 'unimported')) {
      foreach ($u in $json.unimported) { $unimported += (Normalize-Path $u) }
    }
  } catch {
    Write-Warning ("Could not parse .unimported.json: {0}" -f $_.Exception.Message)
  }
}

# --- Overrides ---
$keepListPath   = "tools/scan/keep-list.txt"
$forceListPath  = "tools/scan/force-archive.txt"
$keepList  = @()
$forceList = @()
if (Test-Path $keepListPath)  {
  foreach ($ln in Get-Content $keepListPath) { if ($ln -match '\S') { $keepList += (Normalize-Path $ln) } }
}
if (Test-Path $forceListPath) {
  foreach ($ln in Get-Content $forceListPath) { if ($ln -match '\S') { $forceList += (Normalize-Path $ln) } }
}

# --- Whitelists ---
$whitelistDirs = @('docs','doc','test','tests','__tests__','.github','.vscode','scripts','tools','config')
$whitelistFiles = @(
  'readme.md','changelog.md','license','license.md','contributing.md',
  'package.json','package-lock.json','yarn.lock','pnpm-lock.yaml',
  '.eslintrc','.eslintrc.js','.eslintignore','.prettierrc','.prettierrc.json','.prettierignore',
  'tsconfig.json','jest.config.js','.gitignore','.gitattributes'
)

$runtimeCritical = @(
  'preload.js','renderer.js','index.html','extended-settings.html','style.css'
)

function Is-RuntimeAsset([string]$p) {
  if ($p -match '(^|/)assets/.*\.(ico|png|svg)$') { return $true }
  foreach ($n in $runtimeCritical) {
    if ($p.ToLower().EndsWith($n)) { return $true }
  }
  return $false
}

function Is-SafeArchive([string]$p) {
  $leaf = Split-Path $p -Leaf
  if ($leaf -match '(?i)backup') { return $true }
  if ($leaf -ieq 'perf-dashboard.client.js') { return $true }
  if ($leaf -ieq 'performance-dashboard.html') { return $true }
  return $false
}

# Filter RepoOnly -> candidates
$candidates = @()
foreach ($p in $repoOnly) {
  if ($p -match '^node_modules/') { continue }
  $leaf = Split-Path $p -Leaf
  $dir1 = ($p -split '/')[0]
  if ($whitelistFiles -contains $leaf.ToLower()) { continue }
  if ($whitelistDirs -contains $dir1.ToLower())   { continue }
  $candidates += $p
}

# Helpers
function Is-GitTracked([string]$relPath) {
  $global:LASTEXITCODE = 0
  try {
    git ls-files --error-unmatch -- "$relPath" *> $null
    if ($LASTEXITCODE -eq 0) { return $true } else { return $false }
  } catch { return $false }
}

# Classify
$today = Get-Date -Format 'yyyy-MM-dd'
$archiveRoot = "archive/$today"
$actions = New-Object System.Collections.ArrayList

foreach ($p in $candidates) {
  if ($keepList -contains $p) {
    $null = $actions.Add([PSCustomObject]@{ path=$p; decision="KEEP (override)"; reason="keep-list.txt"; mode=$Mode })
    continue
  }

  $isRuntime = Is-RuntimeAsset $p
  $isSafe    = Is-SafeArchive  $p
  $isUnimp   = ($unimported -contains $p)
  $isForce   = ($forceList -contains $p)

  $decision = "KEEP (review)"
  $rz = @()
  if ($isForce -or $isSafe -or ($isUnimp -and -not $isRuntime)) {
    if ($Mode -eq "Delete") { $decision = "DELETE" } else { $decision = "ARCHIVE" }
    if ($isForce) { $rz += "force-archive.txt" }
    if ($isSafe)  { $rz += "safe-pattern" }
    if ($isUnimp) { $rz += "unimported" }
    if ($isRuntime) { $rz += "runtime-asset?" }
  } else {
    if ($isRuntime) { $rz += "runtime-asset" } else { $rz += "needs review" }
  }

  $null = $actions.Add([PSCustomObject]@{ path=$p; decision=$decision; reason=($rz -join '+'); mode=$Mode })
}

# Output
$logDir = "tools/scan"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logCsv = Join-Path $logDir "cleanup-actions.csv"
$actions | Export-Csv -NoTypeInformation -Encoding UTF8 $logCsv
Write-Host ("Actions written: {0}" -f $logCsv)

$doArchive = @($actions | Where-Object { $_.decision -eq 'ARCHIVE' })
$doDelete  = @($actions | Where-Object { $_.decision -eq 'DELETE' })
$toReview  = @($actions | Where-Object { $_.decision -like 'KEEP*' })

Write-Host ""
Write-Host "=== Summary ========================="
Write-Host ("ARCHIVE: {0}" -f $doArchive.Count)
Write-Host ("DELETE : {0}" -f $doDelete.Count)
Write-Host ("KEEP   : {0}" -f $toReview.Count)
Write-Host "===================================="
if ($DryRun) {
  foreach ($a in $doArchive) { Write-Host ("  [A] {0}  ({1})" -f $a.path, $a.reason) }
  foreach ($a in $doDelete)  { Write-Host ("  [D] {0}  ({1})" -f $a.path, $a.reason) }
  foreach ($a in $toReview)  { Write-Host ("  [K] {0}  ({1})" -f $a.path, $a.reason) }
  exit 0
}

# Execute
if ($Mode -eq "Archive") {
  if ($doArchive.Count -gt 0) {
    if (-not (Test-Path $archiveRoot)) { New-Item -ItemType Directory -Path $archiveRoot -Force | Out-Null }
    foreach ($a in $doArchive) {
      $src = $a.path

      # Skip if already moved/missing
      if (-not (Test-Path "$src")) {
        Write-Host ("[SKIP] Missing (already moved?): {0}" -f $src)
        continue
      }

      $dst = Join-Path $archiveRoot $src
      $dstDir = Split-Path $dst -Parent
      if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }

      $tracked = Is-GitTracked $src
      if ($tracked) {
        git mv "$src" "$dst"
      } else {
        Move-Item -Force "$src" "$dst"
        # Only add destination; do NOT try to git rm cached on source for untracked files
        git add -f "$dst" *> $null
      }
      Write-Host ("[ARCHIVED] {0} -> {1}" -f $src, $dst)
    }
    git add -A *> $null
    git commit -m ("chore(cleanup): archive unused files ({0})" -f $doArchive.Count) *> $null
  }
} elseif ($Mode -eq "Delete") {
  if ($doDelete.Count -gt 0) {
    $ans = Read-Host "WARNING: {0} files will be deleted. Continue? (y/N)" -f $doDelete.Count
    if ($ans -match '^(y|Y|j|J)') {
      foreach ($a in $doDelete) {
        $src = $a.path
        if (Test-Path "$src") {
          Remove-Item -Force "$src"
          git rm --cached -f "$src" *> $null
          Write-Host ("[DELETED] {0}" -f $src)
        } else {
          Write-Host ("[SKIP] Missing: {0}" -f $src)
        }
      }
      git add -A *> $null
      git commit -m ("chore(cleanup): delete unused files ({0})" -f $doDelete.Count) *> $null
    } else {
      Write-Host "Aborted."
    }
  }
}

Write-Host ("Done. Check: {0}" -f $logCsv)
