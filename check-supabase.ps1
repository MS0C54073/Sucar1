# Quick Supabase Connection Diagnostic Script

Write-Host "Checking Supabase Setup..." -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker Desktop is running" -ForegroundColor Green
    } else {
        Write-Host "Docker Desktop is NOT running" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solution:" -ForegroundColor Yellow
        Write-Host "   1. Start Docker Desktop application" -ForegroundColor White
        Write-Host "   2. Wait for it to fully start" -ForegroundColor White
        Write-Host "   3. Run this script again" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "Docker Desktop is NOT running" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check Supabase status
Write-Host "Checking Supabase status..." -ForegroundColor Yellow
try {
    Push-Location backend
    $supabaseStatus = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Supabase is running" -ForegroundColor Green
        Write-Host ""
        Write-Host $supabaseStatus
    } else {
        Write-Host "Supabase is NOT running" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solution:" -ForegroundColor Yellow
        Write-Host "   Run: .\start-supabase.ps1" -ForegroundColor White
        Write-Host "   Or: cd backend && supabase start" -ForegroundColor White
    }
    Pop-Location
} catch {
    Write-Host "Could not check Supabase status" -ForegroundColor Red
    Write-Host "   Make sure Supabase CLI is installed: npm install -g supabase" -ForegroundColor Yellow
}

Write-Host ""

# Check .env file
Write-Host "Checking backend/.env configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" | Select-String "SUPABASE"
    if ($envContent) {
        Write-Host ".env file found with Supabase configuration" -ForegroundColor Green
        Write-Host ""
        $envContent | ForEach-Object {
            $line = $_.Line
            # Mask sensitive keys
            if ($line -match "SUPABASE_ANON_KEY=(.+)") {
                $key = $matches[1]
                $masked = if ($key.Length -gt 10) { $key.Substring(0, 10) + "..." } else { "***" }
                Write-Host "   $($line -replace $key, $masked)" -ForegroundColor Gray
            } else {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "Warning: .env file exists but no SUPABASE variables found" -ForegroundColor Yellow
    }
} else {
    Write-Host "backend/.env file not found" -ForegroundColor Red
    Write-Host "   Create it with SUPABASE_URL and SUPABASE_ANON_KEY" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed instructions, see: FIX_SUPABASE_CONNECTION.md" -ForegroundColor Cyan
