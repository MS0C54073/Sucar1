# 🔧 Fix Login Issue - Complete Guide

## Quick Diagnosis

Run the comprehensive test script:
```powershell
cd backend
node scripts/test-login-comprehensive.js
```

This will test:
- ✅ Backend server health
- ✅ Login for all test users
- ✅ Identify specific errors

## Most Common Issues & Fixes

### Issue 1: Supabase Not Running ⚠️ MOST COMMON

**Symptoms:**
- Login fails with "Database connection failed"
- Backend logs show: `ECONNREFUSED 127.0.0.1:54325`
- Error: "Database connection failed. Please check if Supabase is running."

**Fix:**
```powershell
# Step 1: Start Docker Desktop
# Step 2: Start Supabase
.\start-supabase.ps1

# Step 3: Verify Supabase is running
cd backend
supabase status

# Step 4: Restart backend
npm run dev
```

### Issue 2: Users Don't Exist in Database

**Symptoms:**
- Login fails with "Invalid email or password"
- Backend logs show: "User not found for email"

**Fix:**
```powershell
cd backend
node scripts/seed-data.js
```

This creates test users:
- Admin: `admin@sucar.com` / `admin123`
- Client: `john.mwansa@email.com` / `client123`
- Car Wash: `sparkle@carwash.com` / `carwash123`
- Driver: `james.mulenga@driver.com` / `driver123`

### Issue 3: Password Not Hashed Correctly

**Symptoms:**
- User exists but login fails
- Backend logs show: "Password mismatch"

**Fix:**
Reset password with correct hash:
```powershell
cd backend
node scripts/reset-admin-password.js
```

Or manually in Supabase SQL Editor:
```sql
-- Generate hash first (run in Node.js):
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('admin123', 10);
-- console.log(hash);

UPDATE users 
SET password = '$2a$10$YOUR_HASH_HERE'
WHERE email = 'admin@sucar.com';
```

### Issue 4: Account Deactivated

**Symptoms:**
- Backend logs show: "Account is deactivated"

**Fix:**
```sql
UPDATE users 
SET is_active = true 
WHERE email = 'user@example.com';
```

### Issue 5: Backend Server Not Running

**Symptoms:**
- Network error / Connection refused
- Cannot reach `http://localhost:5000/api`

**Fix:**
```powershell
cd backend
npm run dev
```

## Step-by-Step Troubleshooting

### Step 1: Check Backend Health
```powershell
curl http://localhost:5000/api/health
```

Should return: `{"success":true,"message":"SuCAR API is running"}`

### Step 2: Check Supabase Connection
```powershell
.\check-supabase.ps1
```

### Step 3: Check Users in Database
Open Supabase Studio: http://localhost:54326
- Go to Table Editor → users
- Verify users exist
- Check if passwords are set (they'll be hashed)

### Step 4: Test Login Endpoint
```powershell
cd backend
node scripts/test-login-comprehensive.js
```

### Step 5: Check Backend Logs
Look for detailed login attempt logs:
- `🔐 Login attempt for: email@example.com`
- `✅ User found: Name (role)`
- `✅ Password verified`
- `✅ Login successful`

## Expected Login Flow

1. ✅ Frontend sends POST to `/api/auth/login`
2. ✅ Backend validates email format and password presence
3. ✅ Backend finds user by email (case-insensitive)
4. ✅ Backend verifies password (bcrypt comparison)
5. ✅ Backend checks if account is active
6. ✅ Backend generates JWT token
7. ✅ Backend returns user data + token
8. ✅ Frontend stores token and navigates

## Debugging Commands

### Check if user exists:
```sql
SELECT id, email, name, role, is_active, 
       CASE WHEN password IS NULL THEN 'No password' ELSE 'Has password' END as password_status
FROM users 
WHERE email = 'admin@sucar.com';
```

### Check password hash format:
```sql
SELECT email, 
       LEFT(password, 30) as password_hash_preview,
       LENGTH(password) as hash_length
FROM users 
WHERE email = 'admin@sucar.com';
```

Password hash should:
- Start with `$2a$10$` (bcrypt format)
- Be 60 characters long

### Test password hash generation:
```javascript
// In Node.js console
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
console.log(hash);
// Compare with database hash
```

## Quick Fix Script

Run this PowerShell script to fix common issues:

```powershell
# Fix Login Issues
Write-Host "🔧 Fixing Login Issues..." -ForegroundColor Cyan

# 1. Check Docker
Write-Host "`n1. Checking Docker..." -ForegroundColor Yellow
docker ps | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Docker is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker is NOT running - Start Docker Desktop first!" -ForegroundColor Red
    exit 1
}

# 2. Check Supabase
Write-Host "`n2. Checking Supabase..." -ForegroundColor Yellow
cd backend
$supabaseStatus = supabase status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Supabase is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Supabase is NOT running" -ForegroundColor Red
    Write-Host "   Starting Supabase..." -ForegroundColor Yellow
    supabase start
}

# 3. Check Backend
Write-Host "`n3. Checking Backend..." -ForegroundColor Yellow
$backendHealth = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -ErrorAction SilentlyContinue
if ($backendHealth.StatusCode -eq 200) {
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "   Start backend with: cd backend && npm run dev" -ForegroundColor Yellow
}

# 4. Test Login
Write-Host "`n4. Testing Login..." -ForegroundColor Yellow
node scripts/test-login-comprehensive.js

Write-Host "`n✅ Fix complete!" -ForegroundColor Green
```

## Still Having Issues?

1. **Check backend terminal** - Look for detailed error logs
2. **Check browser console** - Look for API errors
3. **Run diagnostic**: `.\diagnose-login.ps1`
4. **See detailed guide**: `DIAGNOSE_LOGIN_ISSUE.md`
5. **Check Supabase logs**: `supabase logs`

## Contact Support

If none of these fixes work:
1. Run `node scripts/test-login-comprehensive.js` and share the output
2. Check backend terminal logs and share relevant errors
3. Verify Supabase is accessible: http://localhost:54326
