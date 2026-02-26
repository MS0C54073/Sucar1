# 🔧 Fix "Cannot Connect to Server" Error

## Quick Fix (Most Common Solution)

The error means the mobile app can't reach the backend server. **99% of the time, the backend just isn't running.**

### ✅ Solution: Start the Backend

1. **Open a new terminal/PowerShell window**

2. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

3. **Start the backend:**
   ```powershell
   npm run dev
   ```

4. **Wait for these messages:**
   ```
   ✅ Supabase connected successfully
   🚀 SuCAR API Server
      Port: 5000
      Health: http://localhost:5000/api/health
   ```

5. **Test backend is working:**
   - Open browser
   - Go to: `http://localhost:5000/api/health`
   - Should see: `{"success":true,"message":"SuCAR API is running",...}`

6. **Now try the mobile app again** - the error should be gone!

## If Backend Won't Start

### Check Supabase is Running

```powershell
cd backend
supabase status
```

**If Supabase is not running:**
```powershell
# Start Supabase
supabase start

# Or use the script
.\start-supabase.ps1
```

**If you see connection errors:**
- See `FIX_SUPABASE_CONNECTION.md` for detailed help
- Make sure Docker Desktop is running

## Verify Everything is Set Up

### 1. Check Backend Health
```powershell
# In browser or PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/health"
```

### 2. Check Mobile App Configuration
The mobile app should use:
- **API URL:** `http://10.0.2.2:5000/api` (for Android emulator)
- This is already configured in `mobile/src/utils/api.ts`

### 3. Test from Emulator Browser
1. Open browser in Android emulator
2. Go to: `http://10.0.2.2:5000/api/health`
3. Should see JSON response

## Still Not Working?

### Run Diagnostic Script
```powershell
cd mobile
.\check-connection.ps1
```

This will check:
- ✅ Backend is running
- ✅ API URL is configured correctly
- ✅ Android emulator is connected

### Common Issues

**Issue: Backend starts but immediately crashes**
- Check Supabase is running
- Check `.env` file has correct settings
- See backend terminal for error messages

**Issue: Backend runs but mobile app still can't connect**
- Check Windows Firewall allows Node.js
- Try restarting Android emulator
- Verify backend is listening on port 5000

**Issue: "Port 5000 already in use"**
- Another process is using port 5000
- Kill it: `netstat -ano | findstr :5000` then `taskkill /F /PID <pid>`
- Or change port in `backend/.env`: `PORT=5001`

## Summary

**Most likely fix:** Just start the backend! 🚀

```powershell
cd backend
npm run dev
```

Then try the mobile app again.

---

**Need more help?** See `TROUBLESHOOT_CONNECTION.md` for detailed troubleshooting.
