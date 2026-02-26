# 🔧 Troubleshooting "Cannot Connect to Server" Error

## Quick Fix Checklist

### ✅ Step 1: Check Backend is Running

Open a terminal and run:
```powershell
cd backend
npm run dev
```

**Look for:**
- ✅ `🚀 SuCAR API Server`
- ✅ `✅ Supabase connected successfully`
- ✅ `Health: http://localhost:5000/api/health`

**If you see errors:**
- Check Supabase is running: `supabase status`
- Check `.env` file has correct settings
- See `FIX_SUPABASE_CONNECTION.md` for help

### ✅ Step 2: Test Backend Health Endpoint

Open a browser and go to:
```
http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "SuCAR API is running",
  "timestamp": "...",
  "environment": "development"
}
```

**If this doesn't work:**
- Backend is not running or has errors
- Check backend terminal for error messages
- Verify port 5000 is not in use

### ✅ Step 3: Verify Android Emulator Configuration

The mobile app uses:
- **API URL:** `http://10.0.2.2:5000/api`
- **Health Check:** `http://10.0.2.2:5000/api/health`

**Why `10.0.2.2`?**
- Android emulator special IP for accessing host machine's localhost
- This is correct for Android emulator

**For physical device:**
- Use your computer's IP address instead
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `mobile/src/utils/api.ts`:
  ```typescript
  export const API_URL = 'http://YOUR_IP:5000/api';
  ```

### ✅ Step 4: Check Network Connectivity

**From Android Emulator:**
1. Open browser in emulator
2. Go to: `http://10.0.2.2:5000/api/health`
3. Should see JSON response

**If this doesn't work:**
- Backend might not be accessible from emulator
- Check Windows Firewall allows Node.js
- Try restarting emulator

## Common Issues & Solutions

### Issue: "ECONNREFUSED"

**Cause:** Backend is not running

**Solution:**
```powershell
# Terminal 1: Start Supabase
cd backend
supabase start

# Terminal 2: Start Backend
cd backend
npm run dev
```

### Issue: "Network Error" or "Network request failed"

**Cause:** Backend is running but not accessible

**Solutions:**
1. **Check backend is actually running:**
   ```powershell
   # Test in browser
   http://localhost:5000/api/health
   ```

2. **Check Windows Firewall:**
   - Allow Node.js through firewall
   - Or temporarily disable firewall to test

3. **Check port is not blocked:**
   ```powershell
   netstat -ano | findstr :5000
   ```

4. **Restart everything:**
   - Stop backend (Ctrl+C)
   - Restart emulator
   - Start backend again
   - Try app again

### Issue: "Timeout"

**Cause:** Backend is slow or unreachable

**Solutions:**
1. Check backend logs for errors
2. Increase timeout in `mobile/src/utils/api.ts`
3. Check system resources (CPU, RAM)

## Verification Steps

### 1. Backend Health Check
```powershell
# In browser or curl
curl http://localhost:5000/api/health
```

### 2. From Emulator Browser
- Open browser in Android emulator
- Navigate to: `http://10.0.2.2:5000/api/health`
- Should see JSON response

### 3. Check Logs
- **Backend terminal:** Should show incoming requests
- **Metro bundler:** Should show connection attempts
- **React Native debugger:** Check console logs

## Still Not Working?

1. **Check all services are running:**
   - ✅ Supabase (local or remote)
   - ✅ Backend server (port 5000)
   - ✅ Android emulator

2. **Verify configuration:**
   - `backend/.env` - Has correct Supabase URL
   - `mobile/src/utils/api.ts` - Has correct API URL
   - Backend is listening on `0.0.0.0:5000` (not just localhost)

3. **Try clean restart:**
   ```powershell
   # Stop everything
   # Then start in order:
   1. Supabase: supabase start
   2. Backend: cd backend && npm run dev
   3. Mobile: cd mobile && npm run android
   ```

4. **Check for port conflicts:**
   ```powershell
   netstat -ano | findstr :5000
   ```

---

**Most common fix:** Just make sure backend is running! 🚀
