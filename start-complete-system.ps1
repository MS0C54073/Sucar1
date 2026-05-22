#!/usr/bin/env powershell

# Complete SuCAR System Startup Script
# Starts all services in correct order and tests credentials
#
# Usage: .\start-complete-system.ps1

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 SuCAR COMPLETE SYSTEM STARTUP     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Colors
$success = "Green"
$error = "Red"
$warning = "Yellow"
$info = "Cyan"

# Step 1: Check Docker
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "Step 1: CHECKING DOCKER" -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info

$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor $success
    
    # Check if Docker daemon is running
    $dockerRunning = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker daemon is running" -ForegroundColor $success
    } else {
        Write-Host "✗ Docker daemon not running" -ForegroundColor $warning
        Write-Host "  Please start Docker Desktop and try again" -ForegroundColor $warning
        exit 1
    }
} else {
    Write-Host "✗ Docker not found" -ForegroundColor $error
    Write-Host "  Install from: https://www.docker.com/products/docker-desktop" -ForegroundColor $warning
    exit 1
}

Write-Host ""

# Step 2: Start Supabase
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "Step 2: STARTING SUPABASE" -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "This may take 2-3 minutes on first run..." -ForegroundColor $warning

$supabaseStatus = supabase status 2>&1
if ($supabaseStatus -match "Cannot connect") {
    Write-Host "Starting Supabase..." -ForegroundColor $info
    supabase start
} else {
    Write-Host "✓ Supabase already running" -ForegroundColor $success
}

Write-Host ""

# Step 3: Start Backend
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "Step 3: STARTING BACKEND" -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info

Push-Location backend

# Check if backend is already running
$backendRunning = netstat -ano 2>$null | Select-String ":5000"
if ($backendRunning) {
    Write-Host "✓ Backend already running on port 5000" -ForegroundColor $success
} else {
    Write-Host "Starting backend server..." -ForegroundColor $info
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Start-Sleep -Seconds 3
    Write-Host "✓ Backend started (check terminal for logs)" -ForegroundColor $success
}

Pop-Location

Write-Host ""

# Step 4: Setup Database
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "Step 4: RUNNING DATABASE SETUP" -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info

Push-Location backend

# Run migrations and seeding
Write-Host "Running migrations..." -ForegroundColor $info
npm run migrate:auto
Start-Sleep -Seconds 2

Write-Host "Seeding database..." -ForegroundColor $info
npm run seed
Start-Sleep -Seconds 2

Write-Host "Creating admin user..." -ForegroundColor $info
node scripts/create-admin-simple.js

Pop-Location

Write-Host ""

# Step 5: Test Credentials
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "Step 5: TESTING CREDENTIALS" -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info

Start-Sleep -Seconds 2

Push-Location backend
node test-credentials.js
$testResult = $LASTEXITCODE
Pop-Location

Write-Host ""

# Final Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info
Write-Host "SYSTEM STARTUP COMPLETE" -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $info

if ($testResult -eq 0) {
    Write-Host "✅ All credentials working!" -ForegroundColor $success
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor $info
    Write-Host "1. Start frontend:" -ForegroundColor $info
    Write-Host "   cd frontend && npm run dev" -ForegroundColor $info
    Write-Host "2. Open browser:" -ForegroundColor $info
    Write-Host "   http://localhost:5173/login" -ForegroundColor $info
    Write-Host "3. Test with credentials from SEED_DATA_CREDENTIALS.md" -ForegroundColor $info
    Write-Host ""
    Write-Host "Available test users:" -ForegroundColor $info
    Write-Host "• Admin: admin@sucar.com / password123" -ForegroundColor $info
    Write-Host "• Client: john.mwansa@email.com / client123" -ForegroundColor $info
    Write-Host "• Driver: james.mulenga@driver.com / driver123" -ForegroundColor $info
    Write-Host "• Car Wash: sparkle@carwash.com / carwash123" -ForegroundColor $info
} else {
    Write-Host "⚠️  Some tests failed. Check logs above." -ForegroundColor $warning
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor $info
    Write-Host "1. Verify backend is running: npm run dev" -ForegroundColor $info
    Write-Host "2. Check Supabase: supabase status" -ForegroundColor $info
    Write-Host "3. Review .env values" -ForegroundColor $info
}

Write-Host ""
