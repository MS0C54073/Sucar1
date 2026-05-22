# Test Seed Data Login Credentials

$API_BASE = "http://localhost:5000/api"

$testCreds = @(
    @{ email = "admin@sucar.com"; password = "admin123"; role = "admin"; name = "Admin" },
    @{ email = "john.mwansa@email.com"; password = "client123"; role = "client"; name = "Client" },
    @{ email = "james.mulenga@driver.com"; password = "driver123"; role = "driver"; name = "Driver" },
    @{ email = "sparkle@carwash.com"; password = "carwash123"; role = "carwash"; name = "Car Wash" }
)

function Test-Login {
    param([string]$email, [string]$password, [string]$expectedRole, [string]$name)
    
    try {
        Write-Host "`n[TESTING] $name ($email)" -ForegroundColor Cyan
        
        $body = @{ email = $email; password = $password } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            Write-Host "[SUCCESS] Login works!" -ForegroundColor Green
            Write-Host "  Role: $($data.user.role) | Name: $($data.user.name) | Active: $($data.user.is_active)"
            
            if ($data.user.role -eq $expectedRole) {
                Write-Host "  [PASS] Role matches expected: $expectedRole" -ForegroundColor Green
            } else {
                Write-Host "  [WARN] Role mismatch! Expected: $expectedRole, Got: $($data.user.role)" -ForegroundColor Yellow
            }
            return $true
        }
    } 
    catch {
        Write-Host "[FAILED] Login failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n======================================="
Write-Host "SEED DATA LOGIN TEST"
Write-Host "=======================================" -ForegroundColor Yellow

$passed = 0
$failed = 0

foreach ($cred in $testCreds) {
    $success = Test-Login -email $cred.email -password $cred.password -expectedRole $cred.role -name $cred.name
    if ($success) { $passed++ } else { $failed++ }
    Start-Sleep -Milliseconds 500
}

Write-Host "`n=======================================" -ForegroundColor Yellow
Write-Host "RESULTS: $passed Passed, $failed Failed"
if (($passed + $failed) -gt 0) {
    $rate = [Math]::Round(($passed / ($passed + $failed)) * 100)
    Write-Host "Success Rate: $rate%"
}
Write-Host "=======================================" -ForegroundColor Yellow
