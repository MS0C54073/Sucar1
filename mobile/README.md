# 📱 SuCAR Mobile App

React Native mobile application for the SuCAR car wash booking system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Android Studio with Android SDK
- Android Emulator running
- Backend server running on port 5000

### Start the App

**Option 1: Automated Script (Recommended)**
```powershell
.\start-android.ps1
```

**Option 2: Manual**
```powershell
# Install dependencies (first time only)
npm install

# Start Expo
npm start
# Then press 'a' for Android

# Or directly launch on Android
npm run android
```

## 📋 Setup Steps

### 1. Ensure Backend is Running
```powershell
cd backend
npm run dev
```

Backend should be accessible at: `http://localhost:5000/api/health`

### 2. Start Android Emulator
- Open Android Studio
- Tools → Device Manager
- Start your emulator (Medium_Phone_API_36.1)

### 3. Start Mobile App
```powershell
cd mobile
npm run android
```

## 🔧 Configuration

### API URL

The app automatically uses the correct API URL:
- **Android Emulator**: `http://10.0.2.2:5000/api` (configured in `src/utils/api.ts`)
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: Update to your computer's IP address

### For Physical Device

1. Find your computer's IP:
   ```powershell
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. Update `src/utils/api.ts`:
   ```typescript
   export const API_URL = 'http://192.168.1.100:5000/api';
   ```

## 🧪 Testing

### Test Credentials

After running seed data (`cd backend && node scripts/seed-data.js`):

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

1. **Authentication**
   - ✅ Login with credentials
   - ✅ Register new user
   - ✅ Auto-navigation based on role

2. **Client Features**
   - ✅ View home screen
   - ✅ Create booking
   - ✅ View bookings
   - ✅ Manage vehicles

3. **Driver Features**
   - ✅ View assigned bookings
   - ✅ Accept/decline bookings
   - ✅ Update booking status

## 📁 Project Structure

```
mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Login screen
│   │   ├── RegisterScreen.tsx   # Registration screen
│   │   ├── client/               # Client screens
│   │   │   ├── ClientHomeScreen.tsx
│   │   │   ├── BookingScreen.tsx
│   │   │   ├── MyBookingsScreen.tsx
│   │   │   └── VehicleListScreen.tsx
│   │   └── driver/               # Driver screens
│   │       ├── DriverHomeScreen.tsx
│   │       └── DriverBookingsScreen.tsx
│   └── utils/
│       └── api.ts                # API client configuration
├── App.tsx                        # Main app component
├── app.json                       # Expo configuration
└── package.json                   # Dependencies
```

## 🐛 Troubleshooting

### "Cannot connect to server"

**Check:**
1. Backend is running: `http://localhost:5000/api/health`
2. API URL is correct: `http://10.0.2.2:5000/api` (Android emulator)
3. Emulator is running
4. Windows Firewall allows Node.js

**Test:**
```powershell
# From your computer
curl http://localhost:5000/api/health
```

### "Network Error" or "ECONNREFUSED"

**Solutions:**
1. Verify backend is running
2. Check API URL in `src/utils/api.ts`
3. Ensure emulator can access `10.0.2.2`
4. Check Windows Firewall settings

### "Expo not found"

**Fix:**
```powershell
npm install -g @expo/cli
```

### App crashes on startup

**Check:**
1. Metro bundler logs for errors
2. All dependencies installed: `npm install`
3. Clear cache: `npm start -- --reset-cache`
4. Backend is accessible

### Login fails

**Check:**
1. Users exist in database
2. Backend logs show login attempts
3. Supabase is running
4. See `../FIX_LOGIN_ISSUE.md` for detailed help

## 📱 Development

### Hot Reload
- Changes auto-reload in development
- Press `r` in Metro bundler to reload
- Press `m` to open developer menu
- Shake device/emulator for dev menu

### Debugging
- Press `j` in Metro bundler to open debugger
- Check Metro bundler logs
- Check backend terminal logs
- Use React Native Debugger

### Build for Production
```powershell
# Build APK
expo build:android

# Or use EAS Build
eas build --platform android
```

## 🔗 Related Documentation

- **Android Setup**: `ANDROID_SETUP_COMPLETE.md`
- **Quick Start**: `ANDROID_QUICK_START.md`
- **Detailed Setup**: `../ANDROID_STUDIO_SETUP.md`
- **Login Issues**: `../FIX_LOGIN_ISSUE.md`

## 📦 Dependencies

Key dependencies:
- `expo` - Expo framework
- `react-native` - React Native
- `@react-navigation/native` - Navigation
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage

See `package.json` for complete list.

## 🎯 Features

### Implemented
- ✅ User authentication (login/register)
- ✅ Role-based navigation
- ✅ Client booking creation
- ✅ Booking management
- ✅ Vehicle management
- ✅ Driver booking acceptance
- ✅ Error handling
- ✅ API connection testing

### Coming Soon
- 📍 Location services
- 🔔 Push notifications
- 💳 Payment integration
- 📊 Real-time updates
- 🗺️ Map integration

## 📞 Support

For issues:
1. Check troubleshooting section above
2. Check backend logs
3. Check Metro bundler logs
4. See `ANDROID_SETUP_COMPLETE.md` for detailed help

---

**Ready to test!** Start backend, start emulator, then run `npm run android` 🚀
