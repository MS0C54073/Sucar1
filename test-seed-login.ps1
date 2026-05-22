#!/usr/bin/env pwsh

$API_BASE = "http://localhost:5000/api"

# Test credentials from each role
$testCreds = @(
    @{ email = "admin@sucar.com"; password = "admin123"; role = "admin"; name = "Admin" },
    @{ email = "john.mwansa@email.com"; password = "client123"; role = "client"; name = "Client (John Mwansa)" },
    @{ email = "james.mulenga@driver.com"; password = "driver123"; role = "driver"; name = "Driver (James Mulenga)" },
    @{ email = "sparkle@carwash.com"; password = "carwash123"; role = "carwash"; name = "Car Wash (Sparkle)" }
)

function Test-Login([string]$email, [string]$password, [string]$expectedRole, [string]$name) {
    try {
        Write-Host "`n🧪 Testing $name..." -ForegroundColor Cyan
        Write-Host "   Email: $email"
        
        $body = @{
            email = $email
            password = $password
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            Write-Host "✅ LOGIN SUCCESSFUL" -ForegroundColor Green
            Write-Host "   Token received: $($data.token.Substring(0, 30))..." 
            Write-Host "   User role: $($data.user.role)"
            Write-Host "   User name: $($data.user.name)"
            Write-Host "   User active: $($data.user.is_active)"
            
            if ($data.user.role -eq $expectedRole) {
                Write-Host "   ✅ Role matches expected: $expectedRole" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Role mismatch! Expected: $expectedRole, Got: $($data.user.role)" -ForegroundColor Yellow
            }
            
            return $true
        }
    } catch {
        Write-Host "❌ LOGIN FAILED" -ForegroundColor Red
        $response = $_.Exception.Response
        if ($response) {
            Write-Host "   Status: $($response.StatusCode)"
            try {
                $errorBody = $_.Exception.Response.Content.ReadAsStream() | ConvertFrom-Json
                Write-Host "   Message: $($errorBody.message)"
            } catch {
                Write-Host "   Error: $($_.Exception.Message)"
            }
        } else {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

Write-Host "`n$('='*60)"
Write-Host "🚀 SEED DATA LOGIN CREDENTIAL TEST" -ForegroundColor Yellow
Write-Host "$('='*60)"

$passed = 0
$failed = 0

foreach ($cred in $testCreds) {
    $success = Test-Login -email $cred.email -password $cred.password -expectedRole $cred.role -name $cred.name
    if ($success) { $passed++ } else { $failed++ }
    Start-Sleep -Milliseconds 500
}

Write-Host "`n$('='*60)"
Write-Host "📊 TEST RESULTS" -ForegroundColor Yellow
Write-Host "$('='*60)"
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
if (($passed + $failed) -gt 0) {
    $successRate = [Math]::Round(($passed / ($passed + $failed)) * 100)
    Write-Host "📈 Success Rate: $successRate%" -ForegroundColor Cyan
}
Write-Host "$('='*60)`n"

if ($failed -gt 0) { exit 1 } else { exit 0 }
