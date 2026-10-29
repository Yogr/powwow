param([switch]$SkipModels)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-processes.ps1"
Push-Location $root
try {
  New-Item -ItemType Directory -Force .logs,.data | Out-Null
  if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
  try { $controlLock = [IO.File]::Open((Join-Path $root '.data/service-control.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
  catch { throw 'Another Powwow start/stop command is active. Let it finish before retrying.' }
  try {
    $script:managed = @()
    foreach ($record in @(Get-PowwowProcessRecords $root)) {
      $current = Get-PowwowVerifiedProcess $record $root
      if ($current) {
        if (-not $record.started_at_utc) { $record | Add-Member -NotePropertyName started_at_utc -NotePropertyValue $current.CreationDate.ToUniversalTime().ToString('o') }
        $script:managed += $record
      }
    }
    Save-PowwowProcessRecords $root $script:managed
    function Listening([int]$Port) {
      return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
    }
    function Launch([string]$Name, [string]$File, [string[]]$Arguments, [string]$Directory, [int]$Port = 0) {
      if ($Port -and (Listening $Port)) { Write-Host "$Name already listening on $Port; leaving it running."; return }
      $argumentLine = (@($Arguments | ForEach-Object { ConvertTo-PowwowArgument $_ }) -join ' ')
      $process = Start-Process -FilePath $File -ArgumentList $argumentLine -WorkingDirectory $Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput "$root/.logs/$Name.out.log" -RedirectStandardError "$root/.logs/$Name.err.log"
      $script:managed += New-PowwowProcessRecord $Name $process $File $Directory $Arguments
      # Record immediately so a later service failure never orphans earlier ones.
      Save-PowwowProcessRecords $root $script:managed
      if ($Port) {
        for ($i = 0; $i -lt 120; $i++) {
          if (Listening $Port) { Write-Host "$Name ready on $Port"; return }
          $process.Refresh()
          if ($process.HasExited) { throw "$Name stopped. See .logs/$Name.err.log. Already started services remain recorded for stop-local.ps1." }
          Start-Sleep -Milliseconds 500
        }
        throw "$Name did not open port $Port within 60 seconds. See .logs/$Name.err.log; stop-local.ps1 can clean up this start attempt."
      }
      Start-Sleep -Milliseconds 400
      $process.Refresh()
      if ($process.HasExited) { throw "$Name stopped. See .logs/$Name.err.log." }
    }
    function Assert-LocalService([string]$Name, [string]$Url) {
      try {
        $result = Invoke-RestMethod -Uri $Url -TimeoutSec 15
        $valid = switch ($Name) {
          'api' { $result.service -eq 'powwow-api' -and $result.status -eq 'ok' }
          'gpu' { $result.capabilities -contains 'text_to_image' -and $result.simulated -eq $false -and $result.cuda -eq $true }
          'ollama' { [bool]$result.version }
          default { $false }
        }
        if (-not $valid) { throw 'The response belongs to an unexpected service.' }
      } catch { throw "$Name on $Url is not ready or another application owns that port. $($_.Exception.Message)" }
    }
    $python = [IO.Path]::GetFullPath("$root/.venv-api/Scripts/python.exe")
    if (-not (Test-Path -LiteralPath $python)) { throw 'Run scripts/setup-local.ps1 first.' }
    $node = (Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    & "$PSScriptRoot/start-supabase.ps1"
    if (-not $SkipModels) {
      $ollama = "$root/.runtime/ollama/ollama.exe"
      if (-not (Test-Path -LiteralPath $ollama)) { throw 'Local Ollama is missing. Run setup-local.ps1 or use -SkipModels for a configured remote provider.' }
      $env:OLLAMA_HOST = '127.0.0.1:11434'
      $env:OLLAMA_MODELS = "$root/.data/models/ollama"
      $env:OLLAMA_NO_CLOUD = '1'
      Launch 'ollama' $ollama @('serve') $root 11434
      Assert-LocalService 'ollama' 'http://127.0.0.1:11434/api/version'
      if (-not (Test-Path -LiteralPath "$root/.venv/Scripts/python.exe")) { throw 'GPU Python environment is missing. Run setup-local.ps1 or use -SkipModels.' }
      $env:POWWOW_CPU_OFFLOAD = '1'
      $env:POWWOW_UNLOAD_AFTER_JOB = '1'
      # Pass only the GPU runtime's explicit settings. Database and Auth server
      # secrets remain in the API/worker environment and are never loaded here.
      $gpuSettings = @('POWWOW_TRELLIS_LOCAL_ROOT','POWWOW_UPLOAD_HOSTS','POWWOW_ALLOW_LOCAL_STORAGE_HTTP','BLENDER_BINARY','POWWOW_BLENDER_SCRIPT','POWWOW_TRELLIS_RUNS_DIR','POWWOW_WORKER_TOKEN')
      foreach ($key in $gpuSettings) {
        $line = Get-Content -LiteralPath .env | Where-Object { $_ -match ('^\s*' + [regex]::Escape($key) + '=') } | Select-Object -Last 1
        if ($line) { [Environment]::SetEnvironmentVariable($key, ($line -split '=',2)[1].Trim().Trim('"').Trim("'"), 'Process') }
      }
      Launch 'gpu' "$root/.venv/Scripts/python.exe" @('-m','uvicorn','local_server:app','--host','127.0.0.1','--port','8188') "$root/services/gpu_worker" 8188
      Assert-LocalService 'gpu' 'http://127.0.0.1:8188/health'
    }
    Launch 'api' $python @('-m','uvicorn','powwow.main:app','--host','127.0.0.1','--port','8000') "$root/apps/api" 8000
    Assert-LocalService 'api' 'http://127.0.0.1:8000/health'
    $existingWorkers = @(Get-CimInstance Win32_Process | Where-Object {
      $_.ExecutablePath -and [string]::Equals([IO.Path]::GetFullPath($_.ExecutablePath), $python, [StringComparison]::OrdinalIgnoreCase) -and $_.CommandLine -match '(?:^|\s)powwow\.worker(?:\s|$)'
    })
    if ($existingWorkers.Count -eq 0) { Launch 'worker' $python @('-m','powwow.worker') "$root/apps/api" }
    else { Write-Host 'Worker already running; leaving it running.' }
    Launch 'web' $node @("$root/apps/web/node_modules/vite/bin/vite.js",'--host','127.0.0.1','--port','5173','--strictPort') "$root/apps/web" 5173
    Write-Host 'Powwow is running at http://localhost:5173. API docs: http://localhost:8000/docs'
    Write-Host 'Use scripts/stop-local.ps1 to stop script-managed processes. Data is preserved; independently started services stay unmanaged.'
  } finally { if ($controlLock) { $controlLock.Dispose() } }
} finally { Pop-Location }
