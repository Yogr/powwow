param([switch]$SkipModels)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
Push-Location $root
try {
  foreach ($tool in @('uv', 'node', 'npm.cmd', 'docker')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Required tool '$tool' is missing. Install Node.js (with npm) and uv, then run this script again." }
  }
  New-Item -ItemType Directory -Force .runtime,.logs,.data | Out-Null
  try { $setupLock = [IO.File]::Open((Join-Path $root '.data/setup.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
  catch { throw 'Another Powwow setup is active. Let it finish before retrying.' }
  $env:UV_PYTHON_INSTALL_DIR = "$root/.runtime/python"
  if (-not (Test-Path -LiteralPath .venv-api/Scripts/python.exe)) {
    uv venv --python 3.12.11 .venv-api
    if ($LASTEXITCODE -ne 0) { throw 'Python API environment setup failed' }
  }
  uv pip install --python .venv-api/Scripts/python.exe -r apps/api/requirements.txt
  if ($LASTEXITCODE -ne 0) { throw 'API dependency installation failed' }

  function Install-NodeDependencies([string]$Directory, [string]$Label) {
    $lockPath = Join-Path $Directory 'package-lock.json'
    $installedLock = Join-Path $Directory 'node_modules/.package-lock.json'
    $stampPath = Join-Path $root ".data/dependencies-$Label.sha256"
    $desiredHash = (Get-FileHash -LiteralPath $lockPath -Algorithm SHA256).Hash
    $currentHash = if (Test-Path -LiteralPath $stampPath) { (Get-Content -LiteralPath $stampPath -Raw).Trim() } else { '' }
    # npm creates its installed lock after installing the source lock. Adopt
    # an existing complete install once; future setup uses the exact lock hash.
    $adoptExisting = (Test-Path -LiteralPath $installedLock) -and (Get-Item -LiteralPath $installedLock).LastWriteTimeUtc -ge (Get-Item -LiteralPath $lockPath).LastWriteTimeUtc
    $verified = $false
    if ((Test-Path -LiteralPath $installedLock) -and ($currentHash -eq $desiredHash -or ($currentHash -eq '' -and $adoptExisting))) {
      & npm.cmd --prefix $Directory ls --depth=0 --json *> $null
      $verified = $LASTEXITCODE -eq 0
    }
    if (-not $verified) {
      if ($Label -eq 'root') {
        $nativeRoot = [IO.Path]::GetFullPath((Join-Path $root 'node_modules/@embedded-postgres'))
        $activeDatabase = @(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($nativeRoot, [StringComparison]::OrdinalIgnoreCase) })
        if ($activeDatabase.Count) { throw 'PostgreSQL is using the local Node dependencies. Stop the script-managed services before updating dependencies; existing data will be preserved.' }
      }
      & npm.cmd --prefix $Directory ci
      if ($LASTEXITCODE -ne 0) { throw "$Label dependency installation failed" }
    } else { Write-Host "$Label dependencies already match the installed lock." }
    Set-Content -LiteralPath $stampPath -Value $desiredHash -Encoding utf8
  }
  Install-NodeDependencies $root 'root'
  Install-NodeDependencies "$root/apps/web" 'web'
  if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
  if (-not $SkipModels) {
    if (-not (Test-Path -LiteralPath .venv/Scripts/python.exe)) {
      uv venv --python 3.12.11 .venv
      if ($LASTEXITCODE -ne 0) { throw 'GPU Python environment setup failed' }
    }
    uv pip install --python .venv/Scripts/python.exe torch==2.11.0 torchvision==0.26.0 --index-url https://download.pytorch.org/whl/cu128
    if ($LASTEXITCODE -ne 0) { throw 'CUDA PyTorch installation failed' }
    uv pip install --python .venv/Scripts/python.exe -r services/gpu_worker/requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'GPU worker dependency installation failed' }
    if (-not (Test-Path -LiteralPath .runtime/ollama/ollama.exe)) {
      foreach ($tool in @('curl.exe', 'tar.exe')) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Required Windows download/extraction tool '$tool' is missing." }
      }
      curl.exe -L --fail https://github.com/ollama/ollama/releases/download/v0.35.0/ollama-windows-amd64.zip -o .runtime/ollama.zip
      if ($LASTEXITCODE -ne 0) { throw 'Ollama download failed' }
      New-Item -ItemType Directory -Force .runtime/ollama | Out-Null
      tar.exe -xf .runtime/ollama.zip -C .runtime/ollama
      if ($LASTEXITCODE -ne 0) { throw 'Ollama extraction failed' }
    }
  }
  & "$PSScriptRoot/start-supabase.ps1" -CreateQaAccounts
  & "$PSScriptRoot/start-local.ps1" -SkipModels:$SkipModels
  if (-not $SkipModels) {
    $chatModel = 'qwen3:4b-instruct-2507-q4_K_M'
    $modelSetting = Get-Content -LiteralPath .env | Where-Object { $_ -match '^\s*OLLAMA_MODEL=' } | Select-Object -Last 1
    if ($modelSetting) { $chatModel = ($modelSetting -split '=', 2)[1].Trim().Trim('"').Trim("'") }
    if ($chatModel) {
      & .runtime/ollama/ollama.exe pull $chatModel
      if ($LASTEXITCODE -ne 0) { throw 'Chat model download failed' }
    }
    Write-Host 'FLUX weights download automatically on the first image request (about 13 GB).'
  }
} finally { if ($setupLock) { $setupLock.Dispose() }; Pop-Location }
