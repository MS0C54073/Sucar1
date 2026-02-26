# 🚀 Starting Backend for Mobile App

## Quick Start

To allow the mobile app to connect, the backend must be running and listening on all interfaces.

### Start Backend

```powershell
cd backend
npm run dev
```

### What to Look For

You should see:
```
✅ Supabase connected successfully
🚀 SuCAR API Server
   Host: 0.0.0.0
   Port: 5000
   Health: http://localhost:5000/api/health
   Mobile (Android): http://10.0.2.2:5000/api/health
```

### Important Notes

- ✅ Backend now listens on `0.0.0.0` (all interfaces)
- ✅ This allows Android emulator to connect via `10.0.2.2`
- ✅ CORS is configured for mobile app access
- ✅ Health endpoint is available for connection testing

### Test Connection

**From your computer:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health"
```

**From Android emulator browser:**
- Open browser in emulator
- Go to: `http://10.0.2.2:5000/api/health`
- Should see JSON response

### If Backend Won't Start

1. **Check Supabase:**
   ```powershell
   cd backend
   supabase status
   ```

2. **Start Supabase if needed:**
   ```powershell
   supabase start
   ```

3. **Check for port conflicts:**
   ```powershell
   netstat -ano | findstr :5000
   ```

---

**Once backend is running, the mobile app should connect successfully!** ✅
