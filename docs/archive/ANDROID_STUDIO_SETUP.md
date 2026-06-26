# Running SuCAR Mobile App in Android Studio

## Prerequisites

1. **Android Studio** - Download from https://developer.android.com/studio
2. **Node.js** - Already installed
3. **Backend running** - Make sure backend is running on port 5000

## Step-by-Step Setup

### 1. Install Android Studio

1. Download Android Studio from https://developer.android.com/studio
2. Install it with default settings
3. Open Android Studio and let it complete the setup wizard

### 2. Install Android SDK Components

1. Open Android Studio
2. Go to **Tools → SDK Manager**
3. In the **SDK Platforms** tab, check:
   - ✅ Android 13.0 (Tiramisu) or latest
   - ✅ Android 12.0 (S) or Android 11.0 (R)
4. In the **SDK Tools** tab, ensure these are checked:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Intel x86 Emulator Accelerator (HAXM installer) - for Intel processors
5. Click **Apply** and let it install

### 3. Create Android Virtual Device (AVD)

1. In Android Studio, go to **Tools → Device Manager**
2. Click **Create Device**
3. Select a device (e.g., **Pixel 5** or **Pixel 6**)
4. Click **Next**
5. Select a system image (e.g., **Tiramisu API 33** or **S API 31**)
   - If not downloaded, click **Download** next to the system image
6. Click **Next**
7. Review configuration and click **Finish**
8. Your AVD will appear in the Device Manager

### 4. Start the Android Emulator

1. In Android Studio, go to **Tools → Device Manager**
2. Click the **Play** button (▶) next to your AVD
3. Wait for the emulator to boot (first time may take a few minutes)

**Alternative:** You can also start the emulator from command line:
```bash
emulator -avd YOUR_AVD_NAME
```

### 5. Configure Mobile App for Android

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Update the API URL in `mobile/src/context/AuthContext.tsx`:

**For Android Emulator, use:**
```typescript
const API_URL = 'http://10.0.2.2:5000/api';
```

This is the special IP address that Android emulator uses to access your localhost.

3. Install dependencies (if not already done):
```bash
npm install
```

### 6. Install Expo CLI (if needed)

```bash
npm install -g expo-cli
```

### 7. Start the Mobile App

1. Make sure your Android emulator is running
2. In the mobile directory, run:
```bash
npm start
```

3. This will start Expo development server
4. Press **`a`** in the terminal to open on Android emulator
   - Or scan the QR code if using Expo Go on a physical device

**Alternative method:**
```bash
npm run android
```

This will automatically detect and launch on the Android emulator.

### 8. Verify Backend Connection

Make sure your backend is running:
```bash
cd backend
npm run dev
```

The backend should be accessible at `http://localhost:5000`

## Troubleshooting

### Issue: "Cannot connect to backend"

**Solution:**
- Verify backend is running: `http://localhost:5000/api/health`
- Check API_URL in `mobile/src/context/AuthContext.tsx` is `http://10.0.2.2:5000/api`
- Make sure emulator is running before starting the app

### Issue: "Expo not found" or "Command not found"

**Solution:**
```bash
npm install -g expo-cli @expo/cli
```

### Issue: "SDK location not found"

**Solution:**
1. In Android Studio: **File → Project Structure → SDK Location**
2. Note the Android SDK location (usually `C:\Users\YourName\AppData\Local\Android\Sdk`)
3. Set environment variable:
   - Windows: Add to System Environment Variables
   - Variable: `ANDROID_HOME`
   - Value: `C:\Users\YourName\AppData\Local\Android\Sdk`

### Issue: "HAXM not installed" (Intel processors)

**Solution:**
1. Download Intel HAXM from Android Studio SDK Manager
2. Or download from: https://github.com/intel/haxm/releases
3. Install it and restart Android Studio

### Issue: "Emulator is slow"

**Solutions:**
- Enable hardware acceleration in BIOS (Virtualization Technology)
- Allocate more RAM to emulator (in AVD settings)
- Use a lighter system image (API 28-30 instead of latest)

### Issue: "Port 5000 already in use"

**Solution:**
- Change backend port in `backend/.env`:
  ```
  PORT=5001
  ```
- Update API_URL in mobile app accordingly

## Quick Reference

### Start Everything:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Mobile App:**
```bash
cd mobile
npm start
# Then press 'a' for Android
```

**Android Studio:**
- Start emulator from Device Manager
- Or use: `npm run android` in mobile directory

## Testing the App

1. **Register a new user:**
   - Open app in emulator
   - Tap "Register"
   - Choose role (Client, Driver, or Car Wash)
   - Fill in details and register

2. **Login:**
   - Use registered credentials
   - Should navigate to appropriate home screen

3. **Test Features:**
   - **Client**: Add vehicle, create booking
   - **Driver**: Accept bookings, update status
   - **Car Wash**: (Use web dashboard at http://localhost:3000/carwash)

## Network Configuration

### For Physical Android Device:

If you want to test on a real Android device:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. Update `mobile/src/context/AuthContext.tsx`:
   ```typescript
   const API_URL = 'http://192.168.1.100:5000/api'; // Your computer's IP
   ```

3. Make sure phone and computer are on same WiFi network
4. Disable Windows Firewall for port 5000 or allow Node.js through firewall

## Next Steps

Once everything is running:
- Test user registration
- Create bookings
- Test driver acceptance
- Update booking statuses
- Test payment flow

For web dashboard, see `README.md` for frontend setup.
