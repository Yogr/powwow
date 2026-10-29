# Windows PowerShell 5.1 turns redirected native stderr into ErrorRecords.
# Progress on stderr is not failure: decide using the process exit code.
function Invoke-PowwowNative {
  param(
    [Parameter(Mandatory=$true)][string]$File,
    [string[]]$ArgumentList = @(),
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [Parameter(Mandatory=$true)][string]$ErrorPath
  )
  $executable = (Get-Command $File -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
  # These preferences are function-local; callers retain terminating PS errors.
  $ErrorActionPreference = 'Continue'
  $PSNativeCommandUseErrorActionPreference = $false
  $nativeOutput = & $executable @ArgumentList 2> $ErrorPath
  $exitCode = $LASTEXITCODE
  # PS 5.1's > defaults to UTF-16, but our Python config reader needs UTF-8.
  $nativeOutput | Set-Content -LiteralPath $OutputPath -Encoding utf8 -ErrorAction Stop
  return $exitCode
}
