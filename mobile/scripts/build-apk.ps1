# Build a sideloadable Android APK (client app by default).
# Output: mobile/android/app/build/outputs/apk/release/app-release.apk
#     or mobile/android/app/build/outputs/apk/debug/app-debug.apk
param(
  [ValidateSet('client', 'driver')]
  [string]$Variant = 'client',
  [ValidateSet('debug', 'release')]
  [string]$BuildType = 'release',
  [string]$ApiUrl = ''
)

$ErrorActionPreference = 'Stop'
$MobileRoot = Split-Path $PSScriptRoot -Parent
Set-Location $MobileRoot

function Get-LanApiUrl {
  param([string]$Override)
  if ($Override) {
    $u = $Override.Trim().TrimEnd('/')
    if ($u -notmatch '/api$') { $u = "$u/api" }
    return $u
  }
  $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.InterfaceAlias -notmatch 'Loopback|WSL|Hyper-V|VirtualBox|VMware|vEthernet' -and
      $_.IPAddress -notlike '169.*' -and
      $_.IPAddress -notlike '172.17.*'
    } |
    Sort-Object -Property InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress
  if (-not $ip) { $ip = '192.168.0.170' }
  return "http://${ip}:5000/api"
}

$resolvedApi = Get-LanApiUrl -Override $ApiUrl
Write-Host ""
Write-Host "SuCAR APK build" -ForegroundColor Cyan
Write-Host "  Variant : $Variant"
Write-Host "  Type    : $BuildType"
Write-Host "  API URL : $resolvedApi"
Write-Host ""

$env:APP_VARIANT = $Variant
$env:EXPO_PUBLIC_API_URL = $resolvedApi
$env:API_URL = $resolvedApi
$env:CI = '1'

# Android Gradle Plugin requires Java 17+ (system default may be Java 11)
$jbr = 'C:\Program Files\Android\Android Studio\jbr'
if (Test-Path $jbr) {
  $env:JAVA_HOME = $jbr
  $env:Path = "$jbr\bin;$env:Path"
}

$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (Test-Path $sdk) {
  $env:ANDROID_HOME = $sdk
  $env:Path = "$sdk\platform-tools;$env:Path"
  $localProps = Join-Path $MobileRoot 'android\local.properties'
  if (-not (Test-Path $localProps)) {
    $escaped = ($sdk -replace '\\', '\\')
    "sdk.dir=$escaped" | Set-Content -Path $localProps -Encoding ASCII
  }
}

Write-Host "Running expo prebuild (android)..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) { throw "expo prebuild failed" }

$androidDir = Join-Path $MobileRoot 'android'
Set-Location $androidDir

$gradleTask = if ($BuildType -eq 'release') { 'assembleRelease' } else { 'assembleDebug' }
Write-Host "Running gradlew $gradleTask ..." -ForegroundColor Yellow

if (Test-Path '.\gradlew.bat') {
  .\gradlew.bat $gradleTask
} else {
  .\gradlew $gradleTask
}
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }

$outDir = Join-Path $androidDir "app\build\outputs\apk\$BuildType"
$apk = Get-ChildItem $outDir -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $apk) { throw "APK not found in $outDir" }

$destDir = Join-Path $MobileRoot 'dist'
New-Item -ItemType Directory -Force -Path $destDir | Out-Null
$destName = if ($Variant -eq 'driver') { "SuCAR-Driver-$BuildType.apk" } else { "SuCAR-Client-$BuildType.apk" }
$destPath = Join-Path $destDir $destName
Copy-Item $apk.FullName $destPath -Force

Write-Host ""
Write-Host "APK ready:" -ForegroundColor Green
Write-Host "  $($apk.FullName)"
Write-Host "  $destPath"
Write-Host ""
Write-Host "Install on a phone (USB debugging):" -ForegroundColor Cyan
Write-Host "  adb install -r `"$destPath`""
Write-Host ""
Write-Host "Phone and PC must be on the same Wi-Fi. Backend must run at:" -ForegroundColor Yellow
Write-Host "  cd backend && npm run dev"
Write-Host ""
