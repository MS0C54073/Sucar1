# Comprehensive Login Issue Diagnostic Script

Write-Host "🔍 Diagnosing Login Issues..." -ForegroundColor Cyan
Write-Host ""

$issuesFound = @()
$allGood = $true

# 1. Check Backend Server
Write-Host "1️⃣ Checking Backend Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend server is running" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend server returned status: $($response.StatusCode)" -ForegroundColor Red
        $issuesFound += "Backend server returned non-200 status"
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Backend server is NOT running or not accessible" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
    $issuesFound += "Backend server not running"
    $allGood = $false
}

Write-Host ""

# 2. Check Supabase Connection
Write-Host "2️⃣ Checking Supabase Connection..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Docker Desktop is running" -ForegroundColor Green
        
        # Check Supabase status
        cd backend
        $supabaseStatus = supabase status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Supabase is running" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Supabase is NOT running" -ForegroundColor Red
            $issuesFound += "Supabase not running (Docker is running but Supabase is not)"
            $allGood = $false
        }
        cd ..
    } else {
        Write-Host "   ❌ Docker Desktop is NOT running" -ForegroundColor Red
        $issuesFound += "Docker Desktop not running (required for local Supabase)"
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Could not check Docker/Supabase status" -ForegroundColor Red
    $issuesFound += "Cannot verify Supabase status"
    $allGood = $false
}

Write-Host ""

# 3. Check .env Configuration
Write-Host "3️⃣ Checking Backend Configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env"
    $hasSupabaseUrl = $envContent | Select-String "SUPABASE_URL"
    $hasSupabaseKey = $envContent | Select-String "SUPABASE_ANON_KEY"
    
    if ($hasSupabaseUrl -and $hasSupabaseKey) {
        Write-Host "   ✅ .env file has Supabase configuration" -ForegroundColor Green
        
        # Check if using local Supabase
        $supabaseUrl = ($hasSupabaseUrl -split "=")[1].Trim()
        if ($supabaseUrl -like "*localhost*" -or $supabaseUrl -like "*127.0.0.1*") {
            Write-Host "   ℹ️  Using local Supabase: $supabaseUrl" -ForegroundColor Cyan
        } else {
            Write-Host "   ℹ️  Using remote Supabase: $supabaseUrl" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ❌ .env file missing Supabase configuration" -ForegroundColor Red
        $issuesFound += "Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env"
        $allGood = $false
    }
} else {
    Write-Host "   ❌ backend/.env file not found" -ForegroundColor Red
    $issuesFound += "Missing backend/.env file"
    $allGood = $false
}

Write-Host ""

# 4. Test Login Endpoint
Write-Host "4️⃣ Testing Login Endpoint..." -ForegroundColor Yellow
try {
    $testBody = @{
        email = "test@test.com"
        password = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $responseData = $response.Content | ConvertFrom-Json
        if ($responseData.success) {
            Write-Host "   ✅ Login endpoint is working" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Login endpoint responded but login failed (expected for test credentials)" -ForegroundColor Yellow
            Write-Host "      This is normal - endpoint is functional" -ForegroundColor Gray
        }
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Login endpoint is working (401 = invalid credentials, which is expected)" -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "   ❌ Login endpoint returned server error (500)" -ForegroundColor Red
        $issuesFound += "Login endpoint returning 500 error (check backend logs)"
        $allGood = $false
    } else {
        Write-Host "   ❌ Cannot reach login endpoint" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
        $issuesFound += "Cannot reach login endpoint"
        $allGood = $false
    }
}

Write-Host ""

# 5. Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($allGood) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 If login still fails, check:" -ForegroundColor Yellow
    Write-Host "   1. User exists in database (run seed-data.js if needed)" -ForegroundColor White
    Write-Host "   2. User has a password set" -ForegroundColor White
    Write-Host "   3. User account is active (is_active = true)" -ForegroundColor White
    Write-Host "   4. Check backend console for detailed login logs" -ForegroundColor White
} else {
    Write-Host "❌ Issues Found:" -ForegroundColor Red
    Write-Host ""
    foreach ($issue in $issuesFound) {
        Write-Host "   • $issue" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "💡 Fixes:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($issuesFound -contains "Backend server not running") {
        Write-Host "   → Start backend: cd backend && npm run dev" -ForegroundColor White
    }
    
    if ($issuesFound -contains "Docker Desktop not running" -or $issuesFound -contains "Supabase not running") {
        Write-Host "   → Start Supabase: .\start-supabase.ps1" -ForegroundColor White
        Write-Host "   → Or check: .\check-supabase.ps1" -ForegroundColor White
    }
    
    if ($issuesFound -contains "Missing SUPABASE_URL" -or $issuesFound -contains "Missing backend/.env file") {
        Write-Host "   → See: FIX_SUPABASE_CONNECTION.md" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📖 For detailed troubleshooting, see: DIAGNOSE_LOGIN_ISSUE.md" -ForegroundColor Cyan
}

Write-Host ""
