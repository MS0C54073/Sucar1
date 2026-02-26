# 📦 Installing React Native Maps

## ⚠️ Required Installation

The map component requires `react-native-maps` to be installed.

## 🔧 Installation Steps

### Step 1: Install Package

```powershell
cd mobile
npm install react-native-maps
```

Or use Expo:
```powershell
cd mobile
npx expo install react-native-maps
```

### Step 2: For Android (Additional Setup)

If using Expo managed workflow, maps should work automatically.

For bare React Native:
1. Add to `android/app/build.gradle`:
   ```gradle
   dependencies {
     implementation 'com.google.android.gms:play-services-maps:18.0.0'
   }
   ```

2. Add Google Maps API key to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <application>
     <meta-data
       android:name="com.google.android.geo.API_KEY"
       android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
   </application>
   ```

### Step 3: For iOS (Additional Setup)

1. Add to `ios/Podfile`:
   ```ruby
   pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
   ```

2. Run:
   ```bash
   cd ios && pod install
   ```

3. Add Google Maps API key to `ios/YourApp/AppDelegate.m`:
   ```objc
   [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
   ```

## 🗝️ Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps SDK for Android" and "Maps SDK for iOS"
4. Create API key
5. Restrict API key (recommended for production)

## ✅ Verification

After installation:
1. Restart Metro bundler
2. Rebuild app: `npm run android` or `npm run ios`
3. Test map display in booking screens

## 🐛 Troubleshooting

### Map shows blank/gray

**Causes:**
- API key not configured
- API key restrictions too strict
- Maps SDK not enabled

**Fix:**
- Verify API key in `app.json` (Android)
- Check API key restrictions in Google Cloud Console
- Ensure Maps SDK is enabled

### Map not rendering in emulator

**Note:** Android emulator may have issues with Google Maps. Use a physical device for testing maps.

---

**After installation, maps will display correctly!** 🗺️
