# Restart only the verified private GPU service, under Powwow's GPU and service locks.
param([switch]$GpuLockHeld)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-processes.ps1"

if (-not $GpuLockHeld) {
  # Use the same PostgreSQL advisory lock as API/worker inference. A health-only
  # check could race a request that starts between that check and process stop.
  $lockRunner = @'
import os, subprocess, sys
from pathlib import Path
from powwow.resources import local_gpu
with local_gpu() as acquired:
    if not acquired:
        raise SystemExit("The local GPU is in use. Media service left running.")
    result = subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
        str(Path(sys.argv[1]) / "scripts/restart-media.ps1"), "-GpuLockHeld"],
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    raise SystemExit(result.returncode)
'@
  Push-Location (Join-Path $taskRoot 'apps/api')
  try {
    & "$taskRoot/.venv-api/Scripts/python.exe" -c $lockRunner $taskRoot
    if ($LASTEXITCODE -ne 0) { throw 'Media restart did not complete. Existing process records were preserved.' }
  } finally { Pop-Location }
  return
}

$controlLock = [IO.File]::Open((Join-Path $taskRoot '.data/service-control.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
try {
  $records = @(Get-PowwowProcessRecords $taskRoot)
  $gpuRecords = @($records | Where-Object { $_.name -eq 'gpu' })
  if ($gpuRecords.Count -ne 1) { throw 'Expected one recorded GPU service. No processes were stopped.' }
  $record = $gpuRecords[0]
  $current = Get-PowwowVerifiedProcess $record $taskRoot
  $expectedExecutable = [IO.Path]::GetFullPath((Join-Path $taskRoot '.venv/Scripts/python.exe'))
  if (-not $current -or -not [string]::Equals([IO.Path]::GetFullPath($current.ExecutablePath), $expectedExecutable, [StringComparison]::OrdinalIgnoreCase) -or -not $current.CommandLine.Contains('local_server:app')) {
    throw 'The GPU process could not be verified. It was left running.'
  }
  $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8188/health' -TimeoutSec 10
  if ($health.busy -ne $false) { throw 'The GPU worker is busy or its state is unknown. It was left running.' }
  if ($health.profile -ne 'image' -or $health.simulated -ne $false) { throw 'Unexpected service on port 8188. It was left running.' }
  $snapshot = @(Get-CimInstance Win32_Process)
  $descendants = @(Get-PowwowDescendants $current.ProcessId $snapshot)
  $toStop = @()
  foreach ($child in $descendants) {
    if ($child.CreationDate -lt $current.CreationDate) { continue }
    if ($child.ExecutablePath -and [string]::Equals($child.ExecutablePath, (Join-Path $env:WINDIR 'System32/conhost.exe'), [StringComparison]::OrdinalIgnoreCase)) { continue }
    if (-not $child.ExecutablePath -or -not ([IO.Path]::GetFullPath($child.ExecutablePath)).StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
      throw 'A GPU descendant is outside this workspace. No processes were stopped.'
    }
    $toStop += $child
  }
  $listeners = @(Get-NetTCPConnection -State Listen -LocalPort 8188 -ErrorAction Stop)
  $ownedIds = @($current.ProcessId) + @($descendants | ForEach-Object { $_.ProcessId })
  if (@($listeners | Where-Object { $_.OwningProcess -notin $ownedIds }).Count) { throw 'Port 8188 is owned by an unverified process. No processes were stopped.' }
  foreach ($child in $toStop) {
    $fresh = Get-CimInstance Win32_Process -Filter "ProcessId=$($child.ProcessId)" -ErrorAction SilentlyContinue
    if ($fresh -and $fresh.CreationDate -eq $child.CreationDate -and $fresh.ParentProcessId -eq $child.ParentProcessId) { Stop-Process -Id $fresh.ProcessId -ErrorAction Stop }
  }
  if (Get-PowwowVerifiedProcess $record $taskRoot) { Stop-Process -Id ([int]$record.id) -ErrorAction Stop }
  $remaining = @($records | Where-Object { $_.name -ne 'gpu' })
  Save-PowwowProcessRecords $taskRoot $remaining
  for ($i = 0; $i -lt 20; $i++) {
    if (-not (Get-NetTCPConnection -State Listen -LocalPort 8188 -ErrorAction SilentlyContinue)) { break }
    Start-Sleep -Milliseconds 250
  }
  if (Get-NetTCPConnection -State Listen -LocalPort 8188 -ErrorAction SilentlyContinue) { throw 'Port 8188 is still occupied. No replacement was started.' }
  $env:POWWOW_CPU_OFFLOAD = '1'
  $env:POWWOW_UNLOAD_AFTER_JOB = '1'
  $gpuSettings = @('POWWOW_TRELLIS_LOCAL_ROOT','POWWOW_UPLOAD_HOSTS','POWWOW_ALLOW_LOCAL_STORAGE_HTTP','BLENDER_BINARY','POWWOW_BLENDER_SCRIPT','POWWOW_TRELLIS_RUNS_DIR','POWWOW_WORKER_TOKEN')
  foreach ($key in $gpuSettings) {
    $line = Get-Content -LiteralPath (Join-Path $taskRoot '.env') | Where-Object { $_ -match ('^\s*' + [regex]::Escape($key) + '=') } | Select-Object -Last 1
    if ($line) { [Environment]::SetEnvironmentVariable($key, ($line -split '=',2)[1].Trim().Trim('"').Trim("'"), 'Process') }
  }
  $arguments = @('-m','uvicorn','local_server:app','--host','127.0.0.1','--port','8188')
  $argumentLine = (@($arguments | ForEach-Object { ConvertTo-PowwowArgument $_ }) -join ' ')
  $directory = Join-Path $taskRoot 'services/gpu_worker'
  $process = Start-Process -FilePath $expectedExecutable -ArgumentList $argumentLine -WorkingDirectory $directory -WindowStyle Hidden -PassThru -RedirectStandardOutput "$taskRoot/.logs/gpu.out.log" -RedirectStandardError "$taskRoot/.logs/gpu.err.log"
  Save-PowwowProcessRecords $taskRoot ($remaining + @(New-PowwowProcessRecord 'gpu' $process $expectedExecutable $directory $arguments))
  for ($i = 0; $i -lt 100; $i++) {
    $process.Refresh()
    if ($process.HasExited) { throw 'The media worker stopped; see .logs/gpu.err.log. Its process record was retained.' }
    try {
      $ready = Invoke-RestMethod -Uri 'http://127.0.0.1:8188/health' -TimeoutSec 2
      if ($ready.status -eq 'available' -and $ready.simulated -eq $false -and $ready.image_operations -contains 'edit') {
        Write-Host 'Private GPU worker restarted with reference image editing. Other services and files were preserved.'
        return
      }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  throw 'Media worker readiness was not confirmed. Its process record was retained for inspection.'
} finally { $controlLock.Dispose() }
