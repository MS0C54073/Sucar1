# 🔧 Quick Fix: Connection Error in Mobile App

## ⚡ Fastest Solution

**Run this script from the project root:**
```powershell
.\start-backend-for-mobile.ps1
```

This script will:
- ✅ Check if backend is already running
- ✅ Start Supabase if needed
- ✅ Start the backend server
- ✅ Verify the connection
- ✅ Give you clear instructions

## 📋 Manual Steps (If Script Doesn't Work)

### Step 1: Start Supabase
```powershell
cd backend
supabase start
```

Wait for all services to show "healthy"

### Step 2: Start Backend
```powershell
cd backend
npm run dev
```

**Look for these messages:**
```
✅ Supabase connected successfully
🚀 SuCAR API Server
   Host: 0.0.0.0
   Port: 5000
   Mobile (Android): http://10.0.2.2:5000/api/health
```

### Step 3: Test Connection

**From your computer:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health"
```

Should return: `{"success":true,"message":"SuCAR API is running",...}`

### Step 4: Try Mobile App Again

Once you see the backend running messages, try registration/login in the mobile app.

## ✅ Verification

**Backend is ready when:**
- ✅ You see `🚀 SuCAR API Server` in the backend terminal
- ✅ You see `Host: 0.0.0.0` (not just localhost)
- ✅ Health check works: `http://localhost:5000/api/health`

**Then the mobile app should work!** 🎉

## 🐛 Still Not Working?

1. **Check backend terminal** - Look for errors
2. **Check Supabase** - Run `cd backend && supabase status`
3. **Check port** - Run `netstat -ano | findstr :5000`
4. **Restart everything** - Close all terminals, restart backend

---

**Most common issue:** Backend is not running. Just start it! 🚀
