# 🚨 Quick Fix: Users Unable to Login

## Most Likely Cause

**Supabase is not running** - This is the #1 reason login fails.

## Quick Fix (3 Steps)

### Step 1: Start Docker Desktop
1. Open **Docker Desktop** application
2. Wait for it to fully start (whale icon in system tray)

### Step 2: Start Supabase
```powershell
.\start-supabase.ps1
```

Or manually:
```powershell
cd backend
supabase start
```

### Step 3: Restart Backend
```powershell
cd backend
npm run dev
```

## Verify It's Working

After starting Supabase and backend, you should see:
```
✅ Supabase connected successfully
📍 Connected to: http://localhost:54325
🚀 SuCAR API Server
   Port: 5000
```

## Test Login

Use these test credentials (from seed data):

**Admin:**
- Email: `admin@sucar.com`
- Password: `admin123`

**Client:**
- Email: `john.mwansa@email.com`
- Password: `client123`

**Car Wash:**
- Email: `sparkle@carwash.com`
- Password: `carwash123`

**Driver:**
- Email: `james.mulenga@driver.com`
- Password: `driver123`

## If Users Don't Exist

If you get "Invalid email or password" even after starting Supabase, create test users:

```powershell
cd backend
node scripts/seed-data.js
```

This creates all test users with the credentials above.

## Diagnostic Tools

### Run Full Diagnostic
```powershell
.\diagnose-login.ps1
```

This will check:
- ✅ Backend server status
- ✅ Supabase connection
- ✅ Configuration files
- ✅ Login endpoint

### Check Supabase Only
```powershell
.\check-supabase.ps1
```

## Common Error Messages

### "Invalid email or password"
- **Cause**: User doesn't exist OR Supabase not running
- **Fix**: Start Supabase, verify user exists

### "Database connection failed"
- **Cause**: Supabase not running
- **Fix**: Start Supabase with `.\start-supabase.ps1`

### "ECONNREFUSED 127.0.0.1:54325"
- **Cause**: Supabase not running
- **Fix**: Start Supabase

### Network Error / Cannot reach API
- **Cause**: Backend server not running
- **Fix**: Start backend with `cd backend && npm run dev`

## Still Not Working?

1. **Check backend terminal** - Look for detailed error logs
2. **Check browser console** - Look for API errors
3. **Run diagnostic**: `.\diagnose-login.ps1`
4. **See detailed guide**: `DIAGNOSE_LOGIN_ISSUE.md`

## Expected Behavior

When login works correctly:
1. ✅ Backend receives login request
2. ✅ Backend finds user in database
3. ✅ Backend verifies password
4. ✅ Backend returns JWT token + user data
5. ✅ Frontend stores token and navigates to dashboard

---

**Quick Checklist:**
- [ ] Docker Desktop is running
- [ ] Supabase is started (`supabase status` shows running)
- [ ] Backend server is running (port 5000)
- [ ] Users exist in database (run seed-data.js if needed)
- [ ] Using correct credentials (see test credentials above)
