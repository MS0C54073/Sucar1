# Stops Node processes listening on Expo Metro ports (8081–8085).
$ErrorActionPreference = 'SilentlyContinue'
$ports = 8081, 8082, 8083, 8084, 8085
$stopped = @()

foreach ($port in $ports) {
    $lines = netstat -ano | Select-String ":$port\s"
    foreach ($line in $lines) {
        if ($line -notmatch 'LISTENING') { continue }
        if ($line -match 'LISTENING\s+(\d+)\s*$') {
            $procId = [int]$Matches[1]
            if ($stopped -contains $procId) { continue }
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -eq 'node') {
                Write-Host "Stopping node on port $port (PID $procId)..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force
                $stopped += $procId
            }
        }
    }
}

Start-Sleep -Seconds 2
Write-Host 'Metro ports cleared.' -ForegroundColor Green
