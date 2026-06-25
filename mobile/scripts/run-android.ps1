# Starts Android emulator (if needed) and runs Expo for client or driver app.
param(
    [ValidateSet('client', 'driver')]
    [string]$Variant = 'client'
)

$ErrorActionPreference = 'Stop'

$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) { $sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

$adb = Join-Path $sdkRoot 'platform-tools\adb.exe'
$emulator = Join-Path $sdkRoot 'emulator\emulator.exe'

if (-not (Test-Path $adb)) {
    Write-Host 'Android SDK not found. Install Android Studio and SDK Platform-Tools.' -ForegroundColor Red
    Write-Host 'https://developer.android.com/studio' -ForegroundColor Yellow
    exit 1
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$(Join-Path $sdkRoot 'platform-tools');$(Join-Path $sdkRoot 'emulator');$env:PATH"

function Get-OnlineDevice {
    $lines = & $adb devices 2>&1
    return ($lines | Select-String '^\S+\s+device$').Count -gt 0
}

function Test-UnauthorizedDevice {
    $lines = & $adb devices 2>&1
    return ($lines | Select-String 'unauthorized').Count -gt 0
}

function Get-FreeMetroPort {
    param([int[]]$Candidates = @(8081, 8082, 8083, 8084, 8085))
    foreach ($port in $Candidates) {
        $inUse = netstat -ano | Select-String ":$port\s" | Select-String 'LISTENING'
        if (-not $inUse) { return $port }
    }
    return 8090
}

function Start-EmulatorIfNeeded {
    & $adb kill-server | Out-Null
    Start-Sleep -Seconds 1
    & $adb start-server | Out-Null

    if (Test-UnauthorizedDevice) {
        Write-Host 'USB device is unauthorized.' -ForegroundColor Red
        Write-Host 'On your phone: Settings -> Developer options -> Revoke USB debugging authorizations,' -ForegroundColor Yellow
        Write-Host 'then reconnect USB and tap Allow on the debugging prompt.' -ForegroundColor Yellow
        exit 1
    }

    if (Get-OnlineDevice) {
        Write-Host 'Android device already online.' -ForegroundColor Green
        return
    }

    if (-not (Test-Path $emulator)) {
        Write-Host 'emulator.exe not found. Open Android Studio -> Device Manager -> Start a device.' -ForegroundColor Red
        exit 1
    }

    $avds = & $emulator -list-avds 2>&1
    if (-not $avds -or $avds.Count -eq 0) {
        Write-Host 'No AVD found. Create one in Android Studio -> Device Manager.' -ForegroundColor Red
        exit 1
    }

    $avd = $avds[0]
    if ($avds -match 'Medium_Phone') {
        $avd = ($avds | Where-Object { $_ -match 'Medium_Phone' } | Select-Object -First 1)
    }

    Write-Host "Starting emulator: $avd" -ForegroundColor Cyan
    Start-Process -FilePath $emulator -ArgumentList @('-avd', $avd, '-no-snapshot-load') -WindowStyle Normal | Out-Null

    Write-Host 'Waiting for emulator to boot (up to 120s)...' -ForegroundColor Gray
    for ($i = 1; $i -le 24; $i++) {
        Start-Sleep -Seconds 5
        & $adb kill-server | Out-Null
        & $adb start-server | Out-Null
        if (Get-OnlineDevice) {
            Write-Host 'Emulator ready.' -ForegroundColor Green
            return
        }
        Write-Host "  ... still booting ($($i * 5)s)"
    }

    Write-Host 'Emulator did not come online. Start it manually from Android Studio, then run again.' -ForegroundColor Red
    exit 1
}

$mobileRoot = Split-Path $PSScriptRoot -Parent
Set-Location $mobileRoot

# Clear stale Metro instances that block Expo from starting
& (Join-Path $PSScriptRoot 'kill-metro.ps1')

Start-EmulatorIfNeeded

$metroPort = Get-FreeMetroPort
Write-Host "Using Metro port $metroPort" -ForegroundColor Cyan

# Route device traffic to dev machine (physical USB + emulator)
& $adb reverse tcp:5000 tcp:5000 2>$null | Out-Null
& $adb reverse tcp:$metroPort tcp:$metroPort 2>$null | Out-Null

Write-Host "Launching SuCAR ($Variant) on Android..." -ForegroundColor Cyan
Write-Host 'Ensure backend is running: cd backend && npm run dev' -ForegroundColor Gray

$env:APP_VARIANT = $Variant
$env:EXPO_NO_DOTENV = '0'
npx expo start --android --port $metroPort
