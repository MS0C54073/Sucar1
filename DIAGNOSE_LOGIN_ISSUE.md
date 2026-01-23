# 🔍 Diagnosing Login Issues

## Quick Diagnosis

Run this diagnostic script to identify the issue:

```powershell
.\diagnose-login.ps1
```

## Common Issues and Fixes

### Issue 1: Supabase Not Running ⚠️ MOST COMMON

**Symptoms:**
- Login fails with "Invalid email or password"
- Backend logs show: `ECONNREFUSED 127.0.0.1:54325`
- Backend shows: `❌ Failed to connect to Supabase`

**Fix:**
1. Start Docker Desktop
2. Start Supabase:
   ```powershell
   .\start-supabase.ps1
   ```
3. Restart backend server

### Issue 2: Backend Server Not Running

**Symptoms:**
- Frontend shows network errors
- Cannot reach `http://localhost:5000/api/auth/login`

**Fix:**
```powershell
cd backend
npm run dev
```

### Issue 3: Users Don't Exist in Database

**Symptoms:**
- Login fails with "Invalid email or password"
- Backend logs show: `❌ Login failed: User not found`

**Fix:**
Run seed data script to create test users:
```powershell
cd backend
node scripts/seed-data.js
```

Test credentials (from seed data):
- **Client**: `john.mwansa@email.com` / `client123`
- **Car Wash**: `sparkle@carwash.com` / `carwash123`
- **Driver**: `james.mulenga@driver.com` / `driver123`
- **Admin**: `admin@sucar.com` / `admin123`

### Issue 4: Password Not Set for User

**Symptoms:**
- Backend logs show: `❌ Login failed: User has no password set`
- User was created via OAuth/Phone auth

**Fix:**
User needs to set a password or use OAuth/Phone login method.

### Issue 5: Account Deactivated

**Symptoms:**
- Backend logs show: `❌ Login failed: Account is deactivated`

**Fix:**
Activate the user in the database:
```sql
UPDATE users SET is_active = true WHERE email = 'user@example.com';
```

### Issue 6: Email Case Sensitivity

**Symptoms:**
- Login works with exact case but fails with different case

**Fix:**
Already handled in code - should work with any case.

## Testing Login

### Test with cURL

```powershell
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@sucar.com\",\"password\":\"admin123\"}'
```

### Test from Frontend

1. Open: http://localhost:5173/login
2. Use test credentials from `ALL_USER_CREDENTIALS.md`
3. Check browser console for errors
4. Check backend terminal for logs

## Debugging Steps

1. **Check Supabase Connection**
   ```powershell
   .\check-supabase.ps1
   ```

2. **Check Backend Health**
   ```powershell
   curl http://localhost:5000/api/health
   ```

3. **Check Users in Database**
   - Open Supabase Studio: http://localhost:54326
   - Go to Table Editor → users
   - Verify users exist and have passwords

4. **Check Backend Logs**
   - Look for detailed login attempt logs
   - Check for database errors
   - Verify password comparison results

5. **Check Frontend Console**
   - Open browser DevTools (F12)
   - Check Console tab for API errors
   - Check Network tab for failed requests

## Expected Login Flow

1. ✅ Frontend sends POST to `/api/auth/login` with email/password
2. ✅ Backend validates input (email format, password not empty)
3. ✅ Backend finds user by email (case-insensitive)
4. ✅ Backend verifies password (bcrypt comparison)
5. ✅ Backend checks if account is active
6. ✅ Backend generates JWT token
7. ✅ Backend returns user data + token
8. ✅ Frontend stores token and navigates to role-based dashboard

## Still Having Issues?

1. Check `FIX_SUPABASE_CONNECTION.md` for Supabase setup
2. Check backend terminal for detailed error logs
3. Verify `.env` file has correct Supabase credentials
4. Ensure all dependencies are installed: `npm install` in backend
