# Quick Fix Script for Login Issues

Write-Host "🔧 Fixing Login Issues..." -ForegroundColor Cyan
Write-Host ""

$issues = @()
$fixed = @()

# 1. Check Docker
Write-Host "1️⃣ Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Docker Desktop is running" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Docker Desktop is NOT running" -ForegroundColor Red
        $issues += "Docker Desktop not running"
        Write-Host "   💡 Please start Docker Desktop and run this script again" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ❌ Docker Desktop is NOT running" -ForegroundColor Red
    $issues += "Docker Desktop not running"
    exit 1
}

Write-Host ""

# 2. Check Supabase
Write-Host "2️⃣ Checking Supabase..." -ForegroundColor Yellow
try {
    Push-Location backend
    $supabaseStatus = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase is running" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Supabase is NOT running" -ForegroundColor Red
        $issues += "Supabase not running"
        Write-Host "   🔄 Starting Supabase..." -ForegroundColor Yellow
        supabase start
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Supabase started successfully" -ForegroundColor Green
            $fixed += "Started Supabase"
        } else {
            Write-Host "   ❌ Failed to start Supabase" -ForegroundColor Red
        }
    }
    Pop-Location
} catch {
    Write-Host "   ❌ Error checking Supabase" -ForegroundColor Red
    $issues += "Supabase check failed"
    Pop-Location
}

Write-Host ""

# 3. Check Backend
Write-Host "3️⃣ Checking Backend Server..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 3 -ErrorAction Stop
    if ($backendHealth.StatusCode -eq 200) {
        Write-Host "   ✅ Backend server is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend returned status: $($backendHealth.StatusCode)" -ForegroundColor Yellow
        $issues += "Backend returned non-200 status"
    }
} catch {
    Write-Host "   ❌ Backend server is NOT running" -ForegroundColor Red
    $issues += "Backend server not running"
    Write-Host "   💡 Start backend with: cd backend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# 4. Test Login
Write-Host "4️⃣ Testing Login..." -ForegroundColor Yellow
try {
    Push-Location backend
    if (Test-Path "scripts\test-login-comprehensive.js") {
        Write-Host "   🔄 Running login tests..." -ForegroundColor Cyan
        node scripts/test-login-comprehensive.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Login tests completed" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Some login tests failed - check output above" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  Test script not found" -ForegroundColor Yellow
    }
    Pop-Location
} catch {
    Write-Host "   ❌ Error running login tests" -ForegroundColor Red
    Pop-Location
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Summary
if ($issues.Count -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 If login still fails:" -ForegroundColor Yellow
    Write-Host "   1. Ensure users exist: cd backend && node scripts/seed-data.js" -ForegroundColor White
    Write-Host "   2. Check backend console for detailed error logs" -ForegroundColor White
    Write-Host "   3. Verify credentials in ALL_USER_CREDENTIALS.md" -ForegroundColor White
} else {
    Write-Host "❌ Issues Found:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "   • $issue" -ForegroundColor Yellow
    }
    Write-Host ""
    if ($fixed.Count -gt 0) {
        Write-Host "✅ Fixed:" -ForegroundColor Green
        foreach ($fix in $fixed) {
            Write-Host "   • $fix" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "💡 Please restart backend and try again" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📖 For detailed troubleshooting, see: FIX_LOGIN_ISSUE.md" -ForegroundColor Cyan
Write-Host ""
