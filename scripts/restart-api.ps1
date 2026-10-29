# Restart only verified API/worker processes; keep the database, web and GPU services.
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-processes.ps1"
Push-Location (Join-Path $taskRoot 'apps/api')
try {
  $activeCount = & "$taskRoot/.venv-api/Scripts/python.exe" -c "from sqlalchemy import select,func; from powwow.db import SessionLocal; from powwow.models import Run; db=SessionLocal(); print(db.scalar(select(func.count()).select_from(Run).where(Run.status.in_(['preparing','running','postprocessing','cancel_requested'])))); db.close()"
  if ($LASTEXITCODE) { throw 'Could not check active jobs. API and worker were left running.' }
  if ([int]$activeCount -gt 0) { throw 'A job is still active. Let it finish or cancel it, then run scripts/restart-api.ps1. The saved key will apply after restart.' }
} finally { Pop-Location }
$controlLock = [IO.File]::Open((Join-Path $taskRoot '.data/service-control.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
try {
  $records = @(Get-PowwowProcessRecords $taskRoot)
  foreach ($record in @($records | Where-Object { $_.name -in @('worker', 'api') })) {
    $current = Get-PowwowVerifiedProcess $record $taskRoot
    if (-not $current) { continue }
    $snapshot = @(Get-CimInstance Win32_Process)
    foreach ($child in @(Get-PowwowDescendants $current.ProcessId $snapshot)) {
      if ($child.CreationDate -lt $current.CreationDate) { continue }
      # Windows creates a console host for hidden services. It exits with its
      # owner; do not explicitly stop system executables.
      if ($child.ExecutablePath -and [string]::Equals($child.ExecutablePath, (Join-Path $env:WINDIR 'System32/conhost.exe'), [StringComparison]::OrdinalIgnoreCase)) { continue }
      if (-not $child.ExecutablePath -or -not ([IO.Path]::GetFullPath($child.ExecutablePath)).StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'A service descendant could not be verified as part of this workspace. Left running.'
      }
      $fresh = Get-CimInstance Win32_Process -Filter "ProcessId=$($child.ProcessId)" -ErrorAction SilentlyContinue
      if ($fresh -and $fresh.CreationDate -eq $child.CreationDate -and $fresh.ParentProcessId -eq $child.ParentProcessId) {
        Stop-Process -Id $fresh.ProcessId -ErrorAction SilentlyContinue
      }
    }
    if (Get-PowwowVerifiedProcess $record $taskRoot) { Stop-Process -Id ([int]$record.id) }
    Write-Host "Stopped verified $($record.name) process."
  }
  Save-PowwowProcessRecords $taskRoot @($records | Where-Object { $_.name -notin @('worker', 'api') })
} finally { $controlLock.Dispose() }
& "$PSScriptRoot/start-local.ps1" -SkipModels
