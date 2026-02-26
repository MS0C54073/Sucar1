# Quick Start Script for Backend (Mobile App)
# This script ensures the backend is running for mobile app access

Write-Host "🚀 Starting Backend for Mobile App..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
Write-Host "1️⃣ Checking if backend is already running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is already running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   📍 Backend URL: http://localhost:5000" -ForegroundColor White
        Write-Host "   📱 Mobile URL: http://10.0.2.2:5000/api" -ForegroundColor White
        Write-Host ""
        Write-Host "   ✅ You can now use the mobile app!" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "   ⚠️  Backend is not running" -ForegroundColor Yellow
}

Write-Host ""

# Check Supabase
Write-Host "2️⃣ Checking Supabase..." -ForegroundColor Yellow
try {
    Push-Location backend
    $supabaseStatus = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Supabase is not running" -ForegroundColor Yellow
        Write-Host "   🔄 Starting Supabase..." -ForegroundColor Cyan
        supabase start
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Supabase started" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to start Supabase" -ForegroundColor Red
            Write-Host "   💡 Make sure Docker Desktop is running" -ForegroundColor Yellow
        }
    }
    Pop-Location
} catch {
    Write-Host "   ⚠️  Could not check Supabase status" -ForegroundColor Yellow
    Pop-Location
}

Write-Host ""

# Start backend
Write-Host "3️⃣ Starting backend server..." -ForegroundColor Yellow
Write-Host "   This will open in a new window..." -ForegroundColor White
Write-Host ""

try {
    Push-Location backend
    
    # Start backend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🚀 Starting SuCAR Backend Server...' -ForegroundColor Cyan; npm run dev"
    
    Write-Host "   ✅ Backend is starting in a new window..." -ForegroundColor Green
    Write-Host ""
    Write-Host "   ⏳ Please wait 10-15 seconds for the backend to start..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Look for these messages in the new window:" -ForegroundColor White
    Write-Host "      ✅ Supabase connected successfully" -ForegroundColor Green
    Write-Host "      🚀 SuCAR API Server" -ForegroundColor Green
    Write-Host "      Host: 0.0.0.0" -ForegroundColor Green
    Write-Host "      Port: 5000" -ForegroundColor Green
    Write-Host ""
    
    # Wait a bit and test
    Write-Host "   🔍 Testing connection..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    $maxAttempts = 6
    $attempt = 0
    $connected = $false
    
    while ($attempt -lt $maxAttempts -and -not $connected) {
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $connected = $true
                Write-Host "   ✅ Backend is now running!" -ForegroundColor Green
                Write-Host ""
                Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
                Write-Host ""
                Write-Host "✅ SUCCESS! Backend is ready for mobile app" -ForegroundColor Green
                Write-Host ""
                Write-Host "📍 Backend URL: http://localhost:5000" -ForegroundColor White
                Write-Host "📱 Mobile App URL: http://10.0.2.2:5000/api" -ForegroundColor White
                Write-Host ""
                Write-Host "🚀 You can now use the mobile app!" -ForegroundColor Green
                Write-Host ""
                break
            }
        } catch {
            if ($attempt -lt $maxAttempts) {
                Write-Host "   ⏳ Waiting for backend... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    }
    
    if (-not $connected) {
        Write-Host ""
        Write-Host "   ⚠️  Backend is starting but not ready yet" -ForegroundColor Yellow
        Write-Host "   💡 Check the backend window for any errors" -ForegroundColor White
        Write-Host "   💡 Wait a few more seconds and try the mobile app" -ForegroundColor White
    }
    
    Pop-Location
} catch {
    Write-Host "   ❌ Error starting backend" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Tips:" -ForegroundColor Cyan
Write-Host "   • Keep the backend window open while using the mobile app" -ForegroundColor White
Write-Host "   • If you see errors, check the backend window" -ForegroundColor White
Write-Host "   • To stop backend, close the backend window or press Ctrl+C" -ForegroundColor White
Write-Host ""
