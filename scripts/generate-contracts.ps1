$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
Set-Location $root
$env:PYTHONPATH="$root/apps/api"
& "$root/.venv-api/Scripts/python.exe" -c "import json; from pathlib import Path; from powwow.main import app; Path('contracts/openapi.json').write_text(json.dumps(app.openapi(), indent=2), encoding='utf-8')"
if ($LASTEXITCODE) { throw 'OpenAPI export failed' }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  $env:JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'
  $env:PATH="$env:JAVA_HOME/bin;$env:PATH"
}
npx openapi-generator-cli generate -i contracts/openapi.json -g dart -o packages/dart-client --additional-properties=pubName=powwow_api,pubVersion=0.1.0 --global-property apiTests=false,modelTests=false,apiDocs=false,modelDocs=false
if ($LASTEXITCODE) { throw 'Dart generation failed' }
& "$root/.venv-api/Scripts/python.exe" scripts/fix-dart-generator.py
npm --prefix apps/web run generate:api
if ($LASTEXITCODE) { throw 'TypeScript generation failed' }
