﻿param(
  [string]$TraceLog = "require-trace.log",
  [string[]]$HtmlFiles = @("index.html","extended-settings.html"),
  [ValidateSet("Archive","Delete")]
  [string]$Mode = "Archive",
  [switch]$DryRun
)

# Runtime prune tool (PS 5.1 compatible)
# - Builds a Keep set from Node require trace + HTML asset scan + known runtime essentials
# - Archives (git mv) or deletes everything else (excluding node_modules/.git/etc.)

$ErrorActionPreference = "Stop"

function Normalize([string]$p) { return ($p -replace '\\','/').ToLower() }

function To-Rel([string]$p) {
  if (-not $p) { return $p }
  $p2 = $p -replace '\\','/'
  $root = (Get-Location).Path -replace '\\','/'
  if ($p2.ToLower().StartsWith(($root.ToLower() + '/'))) {
    return $p2.Substring($root.Length + 1).ToLower()
  } else {
    return $p2.ToLower()
  }
}

# 1) Gather all tracked files (relative paths), excluding top-level folders we never touch
$allFiles = @()
$tracked = $null
try { $tracked = git ls-files 2>$null } catch {}
if ($tracked) {
  foreach ($f in $tracked) { $allFiles += (Normalize $f) }
} else {
  foreach ($f in Get-ChildItem -Recurse -File) {
    $allFiles += (Normalize ($f.FullName.Replace("$pwd\","")))
  }
}
$excludeTop = @('.git','node_modules') # archive removal allowed; project wants only program files
$allFiles = $allFiles | Where-Object { $top = ($_ -split '/')[0]; -not ($excludeTop -contains $top) }

# 2) Build Keep set
$keep = New-Object System.Collections.Generic.HashSet[string]

# Essentials to keep (project runnable)
foreach ($f in @('package.json','package-lock.json','main.js','preload.js','renderer.js','index.html','extended-settings.html','style.css')) {
  [void]$keep.Add((Normalize $f))
}

# Keep assets/** (icons/images/css/js packaged as static)
if (Test-Path "assets") {
  foreach ($f in Get-ChildItem assets -Recurse -File -ErrorAction SilentlyContinue) {
    [void]$keep.Add((To-Rel $f.FullName))
  }
}

# Keep defaults/** (seed JSON or runtime fs reads)
if (Test-Path "defaults") {
  foreach ($f in Get-ChildItem defaults -Recurse -File -ErrorAction SilentlyContinue) {
    [void]$keep.Add((To-Rel $f.FullName))
  }
}

# 2a) From Node require trace
if (Test-Path $TraceLog) {
  foreach ($ln in Get-Content $TraceLog) {
    if ($ln -like '#*') { continue }
    if ($ln -notmatch '=>') { continue }
    $parts = $ln.Split('=>',2).Trim()
    if ($parts.Length -ne 2) { continue }
    $res = $parts[1]
    # drop node_modules and core modules
    if ($res -match '(?i)node_modules') { continue }
    # absolute -> rel, else take as-is
    if ($res -match '^[a-zA-Z]:\\|^/') {
      $rel = To-Rel $res
      if ($rel -and -not ($rel -match '^(node_modules|\.git)/')) { [void]$keep.Add($rel) }
    } else {
      $rel = Normalize $res
      if ($rel -and -not ($rel -match '^(node_modules|\.git)/')) { [void]$keep.Add($rel) }
    }
  }
} else {
  Write-Warning ("Trace log not found: {0}" -f $TraceLog)
}

# 2b) From HTML references (src= / href=)
$regex = @'
(?i)(?:src|href)\s*=\s*["']([^"']+)["']
'@
function Scan-HtmlRefs([string]$htmlPath) {
  if (-not (Test-Path $htmlPath)) { return }
  $content = Get-Content $htmlPath -Raw
  $matches = [System.Text.RegularExpressions.Regex]::Matches($content, $regex)
  foreach ($m in $matches) {
    $url = $m.Groups[1].Value
    if ($url -match '^(https?:|file:|data:)') { continue }
    # normalize ./ and \ separators
    $url2 = $url -replace '^\.\/',''
    $url2 = $url2 -replace '\\','/'
    $rel = Normalize $url2
    if ($rel -and -not ($rel -match '^(node_modules|\.git)/')) { [void]$keep.Add($rel) }
  }
}
foreach ($h in $HtmlFiles) { Scan-HtmlRefs $h }

# 2c) External keep-list (optional): tools/scan/keep-list.txt
$keepListPath = "tools/scan/keep-list.txt"
if (Test-Path $keepListPath) {
  foreach ($ln in Get-Content $keepListPath) {
    if (-not ($ln -match '\S')) { continue }
    $item = $ln.Trim()
    # Support directory entries ending with /
    if ($item.EndsWith('/')) {
      $dir = $item.TrimEnd('/')
      if (Test-Path $dir) {
        foreach ($f in Get-ChildItem $dir -Recurse -File -ErrorAction SilentlyContinue) {
          [void]$keep.Add((To-Rel $f.FullName))
        }
      }
    } else {
      [void]$keep.Add((Normalize $item))
    }
  }
}

# 3) Compute remove set = allFiles - keep
$remove = @()
foreach ($f in $allFiles) {
  if (-not $keep.Contains($f)) { $remove += $f }
}

# 4) Write report
if (-not (Test-Path "tools/scan")) { New-Item -ItemType Directory -Path "tools/scan" | Out-Null }
$log = "tools/scan/runtime-prune-actions.csv"
"file,action" | Out-File $log -Encoding utf8
foreach ($f in $remove) { "$f,REMOVE" | Add-Content $log -Encoding utf8 }

Write-Host ("Runtime Keep count : {0}" -f $keep.Count)
Write-Host ("To Remove count    : {0}" -f $remove.Count)
Write-Host ("Actions -> {0}" -f $log)

if ($DryRun) {
  Write-Host "DryRun: no changes applied."
  return
}

$today = Get-Date -Format 'yyyy-MM-dd'
$archRoot = "archive/$today-runtime"
if ($Mode -eq "Archive") {
  if (-not (Test-Path $archRoot)) { New-Item -ItemType Directory -Path $archRoot | Out-Null }
  foreach ($f in $remove) {
    $dst = Join-Path $archRoot $f
    $dstDir = Split-Path $dst -Parent
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    $isTracked = $false
    try { git ls-files --error-unmatch -- "$f" *> $null; if ($LASTEXITCODE -eq 0) { $isTracked = $true } } catch {}
    if ($isTracked) {
      git mv "$f" "$dst"
    } else {
      if (Test-Path "$f") { Move-Item -Force "$f" "$dst" }
    }
  }
  git add -A *> $null
  git commit -m ("chore(cleanup): runtime-only prune (moved {0} files)" -f $remove.Count) *> $null
} else {
  $ans = Read-Host ("WARNING: delete {0} files? (y/N)" -f $remove.Count)
  if ($ans -match '^(y|Y|j|J)') {
    foreach ($f in $remove) {
      if (Test-Path "$f") { Remove-Item -Force "$f" }
      git rm --cached -f "$f" *> $null
    }
    git add -A *> $null
    git commit -m ("chore(cleanup): runtime-only prune (deleted {0} files)" -f $remove.Count) *> $null
  } else {
    Write-Host "Aborted."
  }
}