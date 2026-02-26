# Fix Package Version Warnings

## Issue
Expo is showing warnings about package version mismatches and there's a file watcher error.

## Root Cause
The `node_modules` directory is likely corrupted or incomplete, causing the file watcher to fail when trying to watch a non-existent directory.

## Solution

### Option 1: Use the Fix Script (Recommended)
```powershell
cd mobile
.\fix-dependencies.ps1
```

This script will:
1. Clean old node_modules and package-lock.json
2. Use `npx expo install --fix` to install correct versions
3. Fall back to `npm install --legacy-peer-deps` if needed

### Option 2: Manual Fix

1. **Clean everything:**
```powershell
cd mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

2. **Install with Expo (auto-fixes versions):**
```powershell
npx expo install --fix
```

3. **If that fails, use legacy peer deps:**
```powershell
npm install --legacy-peer-deps
```

### Option 3: Ignore Warnings (Quick Fix)

The warnings are just warnings - the app may still work. The file watcher error is the real issue.

To fix just the file watcher error:
```powershell
cd mobile
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

## About the Warnings

The package version warnings from Expo are informational. Expo SDK 54 expects:
- React 19.1.0
- React Native 0.81.5
- @expo/vector-icons ^15.0.3
- etc.

These are already in `package.json`. The warnings appear because:
1. node_modules might have old versions cached
2. Some packages might not be installed yet
3. Peer dependency resolution might be showing conflicts

## After Fixing

Once dependencies are properly installed:
```powershell
npx expo start -c
```

The warnings should be gone, and the file watcher error should be resolved.

## If Issues Persist

1. **Clear Expo cache:**
```powershell
npx expo start -c --clear
```

2. **Check Expo version:**
```powershell
npx expo --version
```

3. **Reinstall Expo CLI:**
```powershell
npm install -g expo-cli@latest
```

---

**The key is to ensure node_modules is clean and complete before starting Expo.**
