# Read-only process checks and isolated record tests; never launches/stops services.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
. "$PSScriptRoot/local-processes.ps1"
. "$PSScriptRoot/local-native.ps1"
$failures = @()
foreach ($file in @('start-local.ps1', 'stop-local.ps1', 'setup-local.ps1', 'local-processes.ps1', 'local-native.ps1', 'start-supabase.ps1', 'stop-supabase.ps1')) {
  $tokens = $null; $parseErrors = $null
  [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $file), [ref]$tokens, [ref]$parseErrors) | Out-Null
  $failures += $parseErrors
}
if ($failures.Count) { throw ($failures | Out-String) }
if ((ConvertTo-PowwowArgument 'C:\A path\folder\') -cne '"C:\A path\folder\\"') { throw 'Whitespace/trailing slash argument quoting failed' }
if ((ConvertTo-PowwowArgument 'x"y') -cne '"x\"y"') { throw 'Embedded quote argument quoting failed' }
if ((ConvertTo-PowwowArgument '') -cne '""') { throw 'Empty argument quoting failed' }

$self = Get-Process -Id $PID
$record = New-PowwowProcessRecord 'test' $self $self.Path $root @('test')
if (-not (Get-PowwowVerifiedProcess $record $root)) { throw 'Live process identity check failed' }
$roundTrip = $record | ConvertTo-Json | ConvertFrom-Json
if (-not (Get-PowwowVerifiedProcess $roundTrip $root)) { throw 'JSON timestamp process identity check failed' }
$record.started_at_utc = $self.StartTime.ToUniversalTime().AddHours(-1).ToString('o')
if (Get-PowwowVerifiedProcess $record $root) { throw 'PID reuse/creation-time guard failed' }
$tree = @([pscustomobject]@{ProcessId=2;ParentProcessId=1}, [pscustomobject]@{ProcessId=3;ParentProcessId=2}, [pscustomobject]@{ProcessId=4;ParentProcessId=999})
$descendants = @(Get-PowwowDescendants 1 $tree)
if ($descendants.Count -ne 2 -or $descendants[0].ProcessId -ne 3 -or $descendants[1].ProcessId -ne 2) { throw 'Leaf-first descendant traversal failed' }

$fixtureRoot = Join-Path $root '.data/script-record-tests'
New-Item -ItemType Directory -Path (Join-Path $fixtureRoot '.data') -Force | Out-Null
Save-PowwowProcessRecords $fixtureRoot @($record)
if (@(Get-PowwowProcessRecords $fixtureRoot).Count -ne 1) { throw 'Single process record round-trip failed' }
Save-PowwowProcessRecords $fixtureRoot @()
if (@(Get-PowwowProcessRecords $fixtureRoot).Count -ne 0) { throw 'Empty record array round-trip failed' }
$stdout = Join-Path $fixtureRoot 'native-output.json'
$stderr = Join-Path $fixtureRoot 'native-error.log'
$probe = Join-Path $fixtureRoot 'native-probe.js'
Set-Content -LiteralPath $probe -Encoding utf8 -Value 'process.stdout.write(JSON.stringify({ok:true})); process.stderr.write("Starting database from backup...\n"); process.exit(Number(process.argv[2]));'
$code = Invoke-PowwowNative node @($probe,'0') $stdout $stderr
if ($code -ne 0 -or -not ((Get-Content -Raw -LiteralPath $stdout | ConvertFrom-Json).ok)) { throw 'Native stderr progress incorrectly failed the command' }
if (([IO.File]::ReadAllBytes($stdout))[0] -eq 255) { throw 'Native JSON was written as UTF-16 instead of UTF-8' }
$code = Invoke-PowwowNative node @($probe,'7') $stdout $stderr
if ($code -ne 7) { throw 'Native failure exit code was lost' }
if ($ErrorActionPreference -ne 'Stop') { throw 'Native runner changed the caller error policy' }
Write-Host 'Native progress, real failure exit codes, UTF-8 output, and caller error policy checks passed.'
Write-Host 'Local scripts: syntax, argument escaping, process identity, PID reuse, descendant traversal, and atomic record tests passed. No services were changed.'
