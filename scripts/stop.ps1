$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $gameRoot 'runtime\server.pid'
if (-not (Test-Path -LiteralPath $pidPath)) { Write-Host 'No launcher-owned server found.'; exit 0 }
$serverProcessId = [int](Get-Content -LiteralPath $pidPath)
$processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $serverProcessId"
$expectedNode = Join-Path $gameRoot 'runtime\node.exe'
$expectedScript = Join-Path $PSScriptRoot 'server.mjs'
if ($null -eq $processInfo) { Write-Host 'Server is already stopped.'; exit 0 }
if ($processInfo.ExecutablePath -ne $expectedNode -or -not $processInfo.CommandLine.Contains($expectedScript)) { throw 'Process does not match this game. Nothing was stopped.' }
Stop-Process -Id $serverProcessId
Write-Host 'Rooyesh local server stopped.'
