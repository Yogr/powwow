$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-processes.ps1"
$recordPath = Join-Path $root '.data/processes.json'
New-Item -ItemType Directory -Force (Join-Path $root '.data') | Out-Null
try { $controlLock = [IO.File]::Open((Join-Path $root '.data/service-control.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
catch { throw 'Another Powwow start/stop command is active. Let it finish before retrying.' }
try {
  $items = @(Get-PowwowProcessRecords $root)
  $remaining = @()
  $order = @('worker', 'api', 'web', 'gpu', 'ollama', 'postgres')
  foreach ($item in @($items | Sort-Object { $position = $order.IndexOf($_.name); if ($position -lt 0) { 99 } else { $position } })) {
    $current = Get-PowwowVerifiedProcess $item $root
    if (-not $current) { Write-Host "Skipped stale or unverifiable process record: $($item.name) ($($item.id))."; continue }
    try {
      if ($item.name -eq 'postgres') {
        # A stale supervisor record must never stop an independently started DB.
        $pgctl = Join-Path $root 'node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe'
        $databasePath = [IO.Path]::GetFullPath((Join-Path $root '.data/postgres'))
        $postmasterFile = Join-Path $databasePath 'postmaster.pid'
        if (Test-Path -LiteralPath $postmasterFile) {
          $postmasterInfo = @(Get-Content -LiteralPath $postmasterFile -TotalCount 2)
          $postmasterId = 0
          if ($postmasterInfo.Count -lt 2 -or -not [int]::TryParse($postmasterInfo[0], [ref]$postmasterId)) { throw 'Cannot verify the database owner from postmaster.pid; left running.' }
          $postmaster = Get-CimInstance Win32_Process -Filter "ProcessId=$postmasterId" -ErrorAction SilentlyContinue
          if (-not $postmaster -or $postmaster.ParentProcessId -ne $current.ProcessId -or [IO.Path]::GetFullPath($postmasterInfo[1]) -ne $databasePath) {
            throw 'This PostgreSQL instance is not a child of the recorded supervisor; left running.'
          }
        } else { Write-Host 'The recorded PostgreSQL supervisor has no active database ownership file.' }
        if ((Test-Path -LiteralPath $postmasterFile) -and (Test-Path -LiteralPath $pgctl)) {
          & $pgctl -D $databasePath -m fast -w -t 30 stop
          if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not confirm a clean shutdown. Its process record is preserved.' }
        } elseif (Test-Path -LiteralPath $postmasterFile) { throw 'pg_ctl is missing. PostgreSQL was left running to preserve a clean shutdown.' }
      }
      $snapshot = @(Get-CimInstance Win32_Process)
      foreach ($child in @(Get-PowwowDescendants -ParentId $current.ProcessId -Snapshot $snapshot)) {
        if ($child.CreationDate -lt $current.CreationDate) { continue }
        $fresh = Get-CimInstance Win32_Process -Filter "ProcessId=$($child.ProcessId)" -ErrorAction SilentlyContinue
        if ($fresh -and $fresh.CreationDate -eq $child.CreationDate -and $fresh.ParentProcessId -eq $child.ParentProcessId) {
          Stop-Process -Id $fresh.ProcessId -ErrorAction SilentlyContinue
        }
      }
      if (Get-PowwowVerifiedProcess $item $root) { Stop-Process -Id ([int]$item.id) -ErrorAction Stop }
      Write-Host "Stopped $($item.name)"
    } catch {
      $remaining += $item
      Write-Warning "$($item.name): $($_.Exception.Message)"
    }
  }
  Save-PowwowProcessRecords $root $remaining
  if ($remaining.Count) { throw 'Some services could not be stopped. Their records were preserved for a retry.' }
  & "$PSScriptRoot/stop-supabase.ps1"
  Write-Host 'Script-managed services stopped. Database, model cache, and artifacts are preserved.'
} finally { $controlLock.Dispose() }
