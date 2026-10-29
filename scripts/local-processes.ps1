# Shared, side-effect-free helpers. Dot-sourcing never starts or stops a process.
function Get-PowwowProcessRecords([string]$RootPath) {
  $recordPath = Join-Path $RootPath '.data/processes.json'
  if (-not (Test-Path -LiteralPath $recordPath)) { return @() }
  try {
    $records = Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json
    # PS 5.1 emits JSON arrays as one pipeline object; enumerate explicitly.
    foreach ($record in $records) { if ($null -ne $record) { $record } }
  }
  catch { throw "Cannot read $recordPath. Preserve this file and repair its JSON before starting more services." }
}

function Save-PowwowProcessRecords([string]$RootPath, [object[]]$Records) {
  $recordPath = Join-Path $RootPath '.data/processes.json'
  $temporaryPath = "$recordPath.tmp"
  ConvertTo-Json -InputObject @($Records) -Depth 6 | Set-Content -LiteralPath $temporaryPath -Encoding utf8
  Move-Item -LiteralPath $temporaryPath -Destination $recordPath -Force
}

function ConvertTo-PowwowArgument([string]$Value) {
  # Start-Process joins ArgumentList. Use Windows C-runtime token escaping.
  if ($Value.Length -gt 0 -and $Value -notmatch '[\s"]') { return $Value }
  $escaped = [regex]::Replace($Value, '(\\*)"', '$1$1\"')
  $escaped = [regex]::Replace($escaped, '(\\+)$', '$1$1')
  return '"' + $escaped + '"'
}

function Get-PowwowVerifiedProcess([object]$Record, [string]$RootPath) {
  if (-not $Record.id -or -not $Record.path) { return $null }
  $current = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$Record.id)" -ErrorAction SilentlyContinue
  if (-not $current -or -not $current.ExecutablePath) { return $null }
  $expectedPath = [IO.Path]::GetFullPath([string]$Record.path)
  if (-not [string]::Equals([IO.Path]::GetFullPath($current.ExecutablePath), $expectedPath, [StringComparison]::OrdinalIgnoreCase)) { return $null }
  if ($Record.started_at_utc) {
    # PowerShell 7 deserializes ISO JSON timestamps into DateTime values.
    # Casting those back to a locale string discards UTC and shifts the time.
    $expectedStart = if ($Record.started_at_utc -is [DateTime]) {
      $Record.started_at_utc.ToUniversalTime()
    } elseif ($Record.started_at_utc -is [DateTimeOffset]) {
      $Record.started_at_utc.UtcDateTime
    } else { [DateTimeOffset]::Parse([string]$Record.started_at_utc).UtcDateTime }
    if ([Math]::Abs(($current.CreationDate.ToUniversalTime() - $expectedStart).TotalSeconds) -gt 1) { return $null }
  } else {
    # Legacy records: accept only this checkout's executable and service marker.
    # Never stop a global Node process from an old PID without its creation time.
    $workspacePrefix = [IO.Path]::GetFullPath($RootPath).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if (-not $expectedPath.StartsWith($workspacePrefix, [StringComparison]::OrdinalIgnoreCase)) { return $null }
    $marker = switch ($Record.name) {
      'api' { 'powwow.main:app' }
      'worker' { 'powwow.worker' }
      'gpu' { 'local_server:app' }
      'ollama' { 'serve' }
      default { return $null }
    }
    if (-not $current.CommandLine -or -not $current.CommandLine.Contains($marker)) { return $null }
  }
  return $current
}

function New-PowwowProcessRecord([string]$Name, [object]$Process, [string]$Executable, [string]$Directory, [string[]]$Arguments) {
  return [pscustomobject]@{
    name = $Name
    id = $Process.Id
    path = [IO.Path]::GetFullPath($Executable)
    started_at_utc = $Process.StartTime.ToUniversalTime().ToString('o')
    directory = [IO.Path]::GetFullPath($Directory)
    arguments = @($Arguments)
  }
}

function Get-PowwowDescendants([int]$ParentId, [object[]]$Snapshot) {
  foreach ($child in @($Snapshot | Where-Object { $_.ParentProcessId -eq $ParentId })) {
    Get-PowwowDescendants -ParentId $child.ProcessId -Snapshot $Snapshot
    $child
  }
}
