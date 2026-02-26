# 📱 Android Mobile App Setup - Complete Guide

## ✅ Quick Start (For Your Emulator: Medium_Phone_API_36.1)

Your emulator is already running! Follow these steps:

### Step 1: Ensure Backend is Running
```powershell
cd backend
npm run dev
```

You should see:
```
✅ Supabase connected successfully
🚀 SuCAR API Server
   Port: 5000
```

### Step 2: Install Mobile Dependencies
```powershell
cd mobile
npm install
```

### Step 3: Start the Mobile App
```powershell
npm start
```

Then press **`a`** when prompted, or run:
```powershell
npm run android
```

The app will automatically:
- ✅ Build and install on your emulator
- ✅ Connect to backend at `http://10.0.2.2:5000/api`
- ✅ Open the app

## 🔧 Configuration

### API URL Configuration

The app is already configured for Android emulator in `mobile/src/utils/api.ts`:

```typescript
export const API_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api' // ✅ Android emulator (your setup)
  : 'https://your-production-api.com/api'; // Production
```

**Why `10.0.2.2`?**
- Android emulator uses `10.0.2.2` as a special alias for `localhost`
- This allows the emulator to access your computer's localhost
- No changes needed!

### For Physical Device (Optional)

If testing on a real Android device:

1. Find your computer's IP:
   ```powershell
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. Update `mobile/src/utils/api.ts`:
   ```typescript
   export const API_URL = 'http://192.168.1.100:5000/api';
   ```

3. Ensure phone and computer are on the same WiFi

## 🧪 Testing the App

### Test Login

Use these test credentials (after running seed data):

**Client:**
- Email: `john.mwansa@email.com`
- Password: `client123`

**Driver:**
- Email: `james.mulenga@driver.com`
- Password: `driver123`

**Admin:**
- Email: `admin@sucar.com`
- Password: `admin123`

### Test Features

1. **Login/Register**
   - ✅ Login with test credentials
   - ✅ Register new user
   - ✅ Auto-navigation based on role

2. **Client Features**
   - ✅ View home screen
   - ✅ Create new booking
   - ✅ View my bookings
   - ✅ Manage vehicles

3. **Driver Features**
   - ✅ View assigned bookings
   - ✅ Accept/decline bookings
   - ✅ Update booking status

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"

**Checklist:**
1. ✅ Backend is running (`cd backend && npm run dev`)
2. ✅ Emulator is running
3. ✅ API URL is `http://10.0.2.2:5000/api`
4. ✅ Backend health check: Open `http://localhost:5000/api/health` in browser

**Test connection:**
```powershell
# From your computer
curl http://localhost:5000/api/health

# Should return: {"success":true,"message":"SuCAR API is running"}
```

### Issue: "Network Error" or "ECONNREFUSED"

**Solutions:**
1. **Check backend is running:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Verify port 5000 is not blocked:**
   ```powershell
   netstat -ano | findstr :5000
   ```

3. **Check Windows Firewall:**
   - Allow Node.js through firewall
   - Or temporarily disable firewall for testing

### Issue: "Expo not found"

**Fix:**
```powershell
npm install -g @expo/cli
```

### Issue: "SDK location not found"

**Fix:**
1. Open Android Studio
2. **File → Project Structure → SDK Location**
3. Note the path (e.g., `C:\Users\User\AppData\Local\Android\Sdk`)
4. Set environment variable:
   ```powershell
   # PowerShell (run as Administrator)
   [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\User\AppData\Local\Android\Sdk", "Machine")
   ```

### Issue: App crashes on startup

**Check:**
1. Check Metro bundler logs for errors
2. Verify all dependencies installed: `npm install`
3. Clear cache: `npm start -- --reset-cache`
4. Check backend is accessible

### Issue: Login fails with "Invalid credentials"

**Check:**
1. Users exist in database (run `cd backend && node scripts/seed-data.js`)
2. Backend logs show login attempts
3. Supabase is running
4. Check `FIX_LOGIN_ISSUE.md` for detailed troubleshooting

## 📱 App Features

### Client App Features
- ✅ Login/Register
- ✅ Home screen with quick actions
- ✅ Create booking
- ✅ View bookings
- ✅ Manage vehicles
- ✅ Booking details

### Driver App Features
- ✅ Login/Register
- ✅ View assigned bookings
- ✅ Accept/decline bookings
- ✅ Update booking status
- ✅ View booking details

## 🔄 Development Workflow

### Start Everything:

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Mobile App:**
```powershell
cd mobile
npm start
# Press 'a' for Android
```

**Android Studio:**
- Start emulator from Device Manager
- Or use: `npm run android` in mobile directory

### Hot Reload

- ✅ Changes to React Native code auto-reload
- ✅ Press `r` in Metro bundler to reload
- ✅ Press `m` to open developer menu
- ✅ Shake device/emulator to open dev menu

## 📊 Debugging

### View Logs

**Metro Bundler:**
- Shows React Native logs
- Network requests
- Errors and warnings

**Backend Terminal:**
- API request logs
- Database queries
- Error details

**React Native Debugger:**
- Press `j` in Metro bundler to open debugger
- Or shake device → "Debug"

### Network Debugging

**Check API calls:**
1. Open Metro bundler
2. Look for API request logs
3. Check backend terminal for request details

**Test API directly:**
```powershell
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@sucar.com\",\"password\":\"admin123\"}'
```

## 🎯 Next Steps

Once the app is running:

1. ✅ Test login with different user roles
2. ✅ Create test bookings
3. ✅ Test driver acceptance flow
4. ✅ Test booking status updates
5. ✅ Test vehicle management
6. ✅ Test error handling

## 📝 Notes

- **API URL**: Already configured for Android emulator (`10.0.2.2`)
- **Backend**: Must be running on port 5000
- **Supabase**: Must be running for database operations
- **Emulator**: Your Medium_Phone_API_36.1 is perfect for testing

## 🆘 Still Having Issues?

1. Check `ANDROID_STUDIO_SETUP.md` for detailed setup
2. Check `FIX_LOGIN_ISSUE.md` for login problems
3. Check backend terminal for API errors
4. Check Metro bundler for React Native errors
5. Verify all prerequisites are installed

---

**Your emulator is ready! Just start the backend and mobile app!** 🚀
