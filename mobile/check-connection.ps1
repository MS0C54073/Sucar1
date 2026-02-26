# Quick Connection Diagnostic Script

Write-Host "🔍 Checking Mobile App Connection Setup..." -ForegroundColor Cyan
Write-Host ""

# Check 1: Backend Health
Write-Host "1️⃣ Checking Backend Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is running and accessible" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   Message: $($healthData.message)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Backend is NOT running or not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   💡 To fix:" -ForegroundColor Yellow
    Write-Host "      cd backend" -ForegroundColor White
    Write-Host "      npm run dev" -ForegroundColor White
    Write-Host ""
}

Write-Host ""

# Check 2: API URL Configuration
Write-Host "2️⃣ Checking API Configuration..." -ForegroundColor Yellow
$apiFile = "src\utils\api.ts"
if (Test-Path $apiFile) {
    $apiContent = Get-Content $apiFile -Raw
    if ($apiContent -match "http://10\.0\.2\.2:5000/api") {
        Write-Host "   ✅ API URL configured for Android emulator" -ForegroundColor Green
        Write-Host "   URL: http://10.0.2.2:5000/api" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  API URL might not be configured correctly" -ForegroundColor Yellow
        Write-Host "   Check: $apiFile" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ API configuration file not found" -ForegroundColor Red
}

Write-Host ""

# Check 3: Android Emulator
Write-Host "3️⃣ Checking Android Emulator..." -ForegroundColor Yellow
try {
    $adbDevices = adb devices 2>&1
    $deviceCount = ($adbDevices | Select-String "device$" | Measure-Object).Count
    
    if ($deviceCount -gt 0) {
        Write-Host "   ✅ Android emulator/device detected" -ForegroundColor Green
        Write-Host "   Devices:" -ForegroundColor Gray
        $adbDevices | Select-String "device$" | ForEach-Object {
            Write-Host "      $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No Android emulator/device detected" -ForegroundColor Yellow
        Write-Host "   💡 Start Android emulator from Android Studio" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  Could not check for Android devices (adb not in PATH)" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   If backend is not running, start it first:" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Then start mobile app:" -ForegroundColor White
Write-Host "   cd mobile && npm run android" -ForegroundColor Gray
Write-Host ""
