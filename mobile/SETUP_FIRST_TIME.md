# 📱 First Time Android App Setup

## ⚠️ Important: Install Dependencies First!

Before running the app, you need to install dependencies.

## 🚀 Quick Setup

### Step 1: Install Dependencies
```powershell
cd mobile
npm install
```

**Note:** This may take 5-10 minutes the first time.

If you get peer dependency warnings, try:
```powershell
npm install --legacy-peer-deps
```

### Step 2: Verify Installation
```powershell
npm list --depth=0
```

You should see all packages listed (not "UNMET DEPENDENCY").

### Step 3: Start the App
```powershell
npm run android
```

Or use the automated script:
```powershell
.\start-android.ps1
```

## 📋 What Gets Installed

The following packages will be installed:

### Core
- `expo` - Expo framework
- `react` - React library
- `react-native` - React Native framework
- `typescript` - TypeScript support

### Navigation
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigator

### Utilities
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage
- `@expo/vector-icons` - Icons
- `react-native-vector-icons` - More icons

### Development
- `@babel/core` - Babel compiler
- `@types/react` - TypeScript types

## ⏱️ Installation Time

- **First time**: 5-10 minutes
- **Subsequent**: Already installed (skipped)

## 🐛 Troubleshooting

### "npm ERR! peer dependency"

**Fix:**
```powershell
npm install --legacy-peer-deps
```

### "npm ERR! network"

**Fix:**
- Check internet connection
- Try: `npm install --registry https://registry.npmjs.org/`

### "npm ERR! permission denied"

**Fix:**
- Run PowerShell as Administrator
- Or use: `npm install --no-optional`

### Installation takes too long

**Normal!** First installation downloads many packages. Be patient.

## ✅ After Installation

Once `npm install` completes:

1. ✅ Dependencies are installed
2. ✅ Ready to run the app
3. ✅ Can use `npm run android`

## 🎯 Next Steps

After dependencies are installed:

1. **Start Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Start Mobile App:**
   ```powershell
   cd mobile
   npm run android
   ```

3. **Test the app** (see `TEST_ANDROID_APP.md`)

---

**Install dependencies first, then you're ready to go!** 🚀
