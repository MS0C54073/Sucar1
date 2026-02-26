# Fix Package Version Issues

## Problem
Expo is showing warnings about incompatible package versions, and there's a file watcher error.

## Solution

The package versions need to match Expo SDK 54. Instead of manually updating, use Expo's automatic fix:

```powershell
cd mobile
npx expo install --fix
```

This will automatically install the correct versions for all packages.

## Alternative: Manual Fix

If `expo install --fix` doesn't work, you can:

1. **Clean install:**
```powershell
cd mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

2. **Then fix versions:**
```powershell
npx expo install --fix
```

## If Still Having Issues

Try installing with legacy peer deps:
```powershell
npm install --legacy-peer-deps
```

Then run:
```powershell
npx expo start -c
```

## Note

The warnings about package versions are just warnings - the app may still work. The file watcher error is more critical and usually means node_modules is corrupted, requiring a clean reinstall.
