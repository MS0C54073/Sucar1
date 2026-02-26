# Fix Mobile App Dependencies Script

Write-Host "🔧 Fixing Mobile App Dependencies..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the mobile directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the mobile directory" -ForegroundColor Red
    Write-Host "   cd mobile" -ForegroundColor Yellow
    exit 1
}

Write-Host "1️⃣ Cleaning old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   Removing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Write-Host "   Removing package-lock.json..." -ForegroundColor Gray
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
Write-Host "   ✅ Cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "2️⃣ Installing dependencies with Expo..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

# Try expo install --fix first
Write-Host "   Running: npx expo install --fix" -ForegroundColor Gray
npx expo install --fix

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  expo install --fix had issues, trying npm install..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Installation failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "   💡 Try manually:" -ForegroundColor Yellow
        Write-Host "      npm install --legacy-peer-deps" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "3️⃣ Verifying installation..." -ForegroundColor Yellow
if (Test-Path "node_modules/expo") {
    Write-Host "   ✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Installation may be incomplete" -ForegroundColor Red
    Write-Host "   💡 Try: npm install --legacy-peer-deps" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Done! You can now run:" -ForegroundColor Green
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host "   or" -ForegroundColor Gray
Write-Host "   npx expo start -c" -ForegroundColor Cyan
Write-Host ""
