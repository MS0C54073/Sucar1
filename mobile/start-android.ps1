# Quick Start Script for Android Mobile App

Write-Host "📱 Starting SuCAR Mobile App for Android..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the mobile directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the mobile directory" -ForegroundColor Red
    Write-Host "   cd mobile" -ForegroundColor Yellow
    exit 1
}

# Check if backend is running
Write-Host "1️⃣ Checking Backend Server..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 3 -ErrorAction Stop
    if ($backendHealth.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend returned status: $($backendHealth.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Backend is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "   💡 Start backend first:" -ForegroundColor Yellow
    Write-Host "      cd backend" -ForegroundColor White
    Write-Host "      npm run dev" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "   Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

Write-Host ""

# Check if node_modules exists and has dependencies
Write-Host "2️⃣ Checking Dependencies..." -ForegroundColor Yellow
$needsInstall = $false

if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  node_modules not found" -ForegroundColor Yellow
    $needsInstall = $true
} else {
    # Check if key dependencies exist
    $keyDeps = @("expo", "react-native", "axios", "@react-navigation/native")
    $missingDeps = @()
    
    foreach ($dep in $keyDeps) {
        if (-not (Test-Path "node_modules\$dep")) {
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Host "   ⚠️  Missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Yellow
        $needsInstall = $true
    }
}

if ($needsInstall) {
    Write-Host "   🔄 Installing dependencies..." -ForegroundColor Cyan
    Write-Host "   This may take a few minutes..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "   💡 Try: npm install --legacy-peer-deps" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "   ✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

Write-Host ""

# Check if Android emulator is running
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
        Write-Host "      Tools → Device Manager → Start emulator" -ForegroundColor White
        Write-Host ""
        $continue = Read-Host "   Continue anyway? (y/n)"
        if ($continue -ne 'y') {
            exit 1
        }
    }
} catch {
    Write-Host "   ⚠️  Could not check for Android devices (adb not in PATH)" -ForegroundColor Yellow
    Write-Host "   💡 Make sure Android SDK Platform-Tools is installed" -ForegroundColor White
}

Write-Host ""

# Start the app
Write-Host "4️⃣ Starting Mobile App..." -ForegroundColor Yellow
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   1. Start Expo development server" -ForegroundColor Gray
Write-Host "   2. Build and install app on Android emulator" -ForegroundColor Gray
Write-Host "   3. Open the app automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "   Press 'a' when prompted to open on Android" -ForegroundColor Cyan
Write-Host "   Or press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start Expo
npm run android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to start app" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Android emulator is running" -ForegroundColor White
    Write-Host "   2. Check that backend is running: http://localhost:5000/api/health" -ForegroundColor White
    Write-Host "   3. Try: npm start (then press 'a' manually)" -ForegroundColor White
    Write-Host "   4. See: ANDROID_SETUP_COMPLETE.md for detailed help" -ForegroundColor White
}
