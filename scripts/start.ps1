param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
$nodePath = Join-Path $gameRoot 'runtime\node.exe'
if (-not (Test-Path -LiteralPath $nodePath)) {
    $installedNode = Get-Command node -ErrorAction SilentlyContinue
    if (-not $installedNode) { throw 'Node.js 22 or newer is required. Install it or provide runtime/node.exe.' }
    $nodePath = $installedNode.Source
}
$serverPath = Join-Path $PSScriptRoot 'server.mjs'
$address = 'http://127.0.0.1:4318'
$running = $false
try {
    $health = Invoke-RestMethod -Uri "$address/health" -TimeoutSec 2
    if ($health.app -ne 'rooyesh-adventure') { throw 'The port belongs to another application.' }
    $running = $true
} catch {
    if ($_.Exception.Message -eq 'The port belongs to another application.') { throw }
}
if (-not $running) {
    $serverProcess = Start-Process -FilePath $nodePath -ArgumentList ('"' + $serverPath + '"') -WorkingDirectory $gameRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $gameRoot 'runtime\server.log') -RedirectStandardError (Join-Path $gameRoot 'runtime\server-error.log')
    Set-Content -LiteralPath (Join-Path $gameRoot 'runtime\server.pid') -Value $serverProcess.Id
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        if ($serverProcess.HasExited) { throw 'Local server could not start. See runtime/server-error.log.' }
        try {
            $health = Invoke-RestMethod -Uri "$address/health" -TimeoutSec 1
            if ($health.app -eq 'rooyesh-adventure') { $running = $true; break }
        } catch {}
    }
}
if (-not $running) { throw 'Local server did not become ready.' }
if (-not $NoBrowser) { Start-Process $address }
