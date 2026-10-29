$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-native.ps1"
$marker = Join-Path $root '.data/supabase-managed.json'
if (-not (Test-Path -LiteralPath $marker)) { Write-Host 'No Powwow Supabase ownership marker; leaving Docker services unchanged.'; return }
$owned = Get-Content -LiteralPath $marker -Raw | ConvertFrom-Json
if ($owned.project_id -ne 'powwow' -or [IO.Path]::GetFullPath($owned.root) -ne $root) { throw 'Supabase ownership marker does not match this checkout.' }
try { $stackLock = [IO.File]::Open((Join-Path $root '.data/supabase-control.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
catch { throw 'Another Powwow Supabase start/stop command is active.' }
try {
  $ids = @(& docker ps -aq --filter 'label=com.supabase.cli.project=powwow')
  foreach ($containerId in $ids) {
    if (-not $containerId) { continue }
    $inspection = (& docker inspect $containerId | ConvertFrom-Json)[0]
    if ([IO.Path]::GetFullPath($inspection.Config.Labels.'com.supabase.cli.workdir') -ne $root) { throw 'A Powwow-named Supabase container belongs to another checkout; left running.' }
  }
  $code = Invoke-PowwowNative npx.cmd @('--yes','supabase@2.119.0','stop','--project-id','powwow','--workdir',$root) "$root/.logs/supabase-stop.private.log" "$root/.logs/supabase-stop.err.log"
  if ($code -ne 0) { throw 'Powwow Supabase shutdown failed; see .logs/supabase-stop.err.log and .logs/supabase-stop.private.log.' }
  Write-Host 'Stopped only Powwow Supabase. Its database and private Storage volumes are preserved.'
} finally { $stackLock.Dispose() }
