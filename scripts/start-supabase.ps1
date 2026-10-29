param([switch]$CreateQaAccounts)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-native.ps1"
Push-Location $root
try {
  New-Item -ItemType Directory -Force .data,.logs | Out-Null
  if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
  $urlLine = Get-Content -LiteralPath .env | Where-Object { $_ -match '^\s*SUPABASE_URL=' } | Select-Object -Last 1
  $configuredUrl = if ($urlLine) { ($urlLine -split '=',2)[1].Trim().Trim('"').Trim("'") } else { '' }
  if ($configuredUrl -match '^https://') { Write-Host 'Using the configured hosted Supabase project.'; return }
  if ($configuredUrl -and $configuredUrl -notin @('http://127.0.0.1:56321','http://localhost:56321')) { throw 'SUPABASE_URL points to another local project. Refusing to change it.' }
  if ((Get-Content -LiteralPath supabase/config.toml -Raw) -notmatch '(?m)^project_id\s*=\s*"powwow"\s*$') { throw 'Unexpected Supabase project identity.' }
  try { $stackLock = [IO.File]::Open((Join-Path $root '.data/supabase-control.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
  catch { throw 'Another Powwow Supabase start/stop command is active.' }
  try {
    $code = Invoke-PowwowNative docker @('info','--format','{{.ServerVersion}}') .logs/docker-check.private.log .logs/docker-check.err.log
    if ($code -ne 0) { throw 'Docker Desktop must be running before starting Powwow Supabase.' }
    $code = Invoke-PowwowNative docker @('network','inspect','powwow-supabase') .logs/supabase-network.json .logs/supabase-network.err.log
    if ($code -ne 0) {
      $code = Invoke-PowwowNative docker @('network','create','--driver','bridge','--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1','powwow-supabase') .logs/supabase-network.private.log .logs/supabase-network.err.log
      if ($code -ne 0) { throw 'Cannot create the isolated Powwow Docker network.' }
    } else {
      $network = Get-Content -LiteralPath .logs/supabase-network.json -Raw | ConvertFrom-Json
      if ($network[0].Options.'com.docker.network.bridge.host_binding_ipv4' -ne '127.0.0.1') { throw 'The Powwow Docker network does not restrict default port binding to loopback.' }
    }
    # CLI status, signing-key output, and startup output contain credentials.
    if (-not (Test-Path -LiteralPath .data/supabase-signing-keys.json)) {
      Set-Content -LiteralPath .data/supabase-signing-keys.json -Value '[]' -Encoding utf8
      $code = Invoke-PowwowNative npx.cmd @('--yes','supabase@2.119.0','gen','signing-key','--algorithm','ES256','--append') .logs/supabase-key-setup.private.log .logs/supabase-key-setup.err.log
      if ($code -ne 0) { throw 'Cannot create local Supabase signing keys; see the private setup log.' }
    }
    Write-Host 'Starting Powwow Supabase (Docker may need a minute)...'
    $code = Invoke-PowwowNative npx.cmd @('--yes','supabase@2.119.0','start','--workdir',$root,'--network-id','powwow-supabase') .logs/supabase-start.private.log .logs/supabase-start.err.log
    if ($code -ne 0) { throw 'Powwow Supabase startup failed; see .logs/supabase-start.err.log and .logs/supabase-start.private.log.' }
    & node "$PSScriptRoot/bind-supabase-loopback.mjs"
    if ($LASTEXITCODE -ne 0) { throw 'Supabase loopback port verification failed.' }
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
      try { $health = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:56321/auth/v1/health' -TimeoutSec 2; if ($health.StatusCode -eq 200) { $ready = $true; break } } catch { }
      Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw 'Supabase Auth did not become healthy after loopback binding.' }
    $statusReady = $false
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
      $code = Invoke-PowwowNative npx.cmd @('--yes','supabase@2.119.0','status','--workdir',$root,'-o','json') .data/supabase-status.json .logs/supabase-status.err.log
      if ($code -eq 0) { $statusReady = $true; break }
      Start-Sleep -Seconds 1
    }
    if (-not $statusReady) { throw 'Cannot read Powwow Supabase status.' }
    $bootstrapArguments = @("$PSScriptRoot/configure-supabase.py")
    if ($CreateQaAccounts) { $bootstrapArguments += '--create-qa' }
    & "$root/.venv-api/Scripts/python.exe" @bootstrapArguments
    if ($LASTEXITCODE -ne 0) { throw 'Powwow Supabase configuration failed.' }
    @{ project_id='powwow'; root=$root; network='powwow-supabase' } | ConvertTo-Json | Set-Content -LiteralPath .data/supabase-managed.json -Encoding utf8
    Write-Host 'Supabase ready: API/Auth/Storage http://127.0.0.1:56321; Studio http://127.0.0.1:56323; local email http://127.0.0.1:56324'
  } finally { if ($stackLock) { $stackLock.Dispose() } }
} finally { Pop-Location }
