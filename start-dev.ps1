# Start SuCAR Development Servers
# This script starts both frontend and backend servers

Write-Host "`n🚀 Starting SuCAR Development Servers`n" -ForegroundColor Cyan

# Check if node_modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

Write-Host "`n✅ Dependencies installed`n" -ForegroundColor Green

# Check if concurrently is installed
if (-not (Test-Path "node_modules/concurrently")) {
    Write-Host "📦 Installing concurrently for running both servers..." -ForegroundColor Yellow
    npm install concurrently --save-dev
}

Write-Host "🌐 Starting servers...`n" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3000`n" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop both servers`n" -ForegroundColor Gray

# Start both servers
npm run dev
