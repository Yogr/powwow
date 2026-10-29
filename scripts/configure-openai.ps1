param([switch]$NoRestart)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$envPath = Join-Path $taskRoot '.env'
if (-not (Test-Path -LiteralPath $envPath)) { throw 'Run setup-local.ps1 first to create the local configuration.' }
Write-Host 'Enter a project API key from the OpenAI dashboard. Input is hidden; the key is saved only in the ignored server .env file.'
$secret = Read-Host -Prompt 'OpenAI project API key' -AsSecureString
$pointer = [IntPtr]::Zero
try {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  $keyValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ($keyValue -notmatch '^sk-[A-Za-z0-9_.-]{16,}$') { throw 'The key format was not recognized. Configuration was left unchanged.' }
  $existing = [IO.File]::ReadAllText($envPath)
  $pattern = '(?m)^\s*OPENAI_API_KEY=[^\r\n]*'
  $line = 'OPENAI_API_KEY=' + $keyValue
  if ([regex]::IsMatch($existing, $pattern)) {
    $updated = [regex]::Replace($existing, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $line })
  } else { $updated = $existing.TrimEnd() + "`r`n" + $line + "`r`n" }
  [IO.File]::WriteAllText($envPath, $updated, [Text.UTF8Encoding]::new($false))
  Write-Host 'Server key saved. It was not printed or sent to the browser.'
} finally {
  if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
  $keyValue = $null; $line = $null; $updated = $null; $existing = $null
  $secret.Dispose()
}
if (-not $NoRestart) { & "$PSScriptRoot/restart-api.ps1" }
Write-Host 'Reload http://localhost:5173 and open a language learning space. Model access and teaching quality still need a live test.'
