# 📱 Creating App Icon

## ⚠️ Issue

Expo requires a **square icon** (1024x1024 pixels) for the app icon. The current `Sucar.png` is 853x831 (not square).

## ✅ Solution Options

### Option 1: Create Square Icon (Recommended)

Create a square version of the SuCAR logo:

1. **Using Image Editor:**
   - Open `Sucar.png` in an image editor (Photoshop, GIMP, Paint.NET, etc.)
   - Resize/crop to 1024x1024 pixels
   - Save as `mobile/assets/icon.png`

2. **Using Online Tool:**
   - Go to https://www.iloveimg.com/resize-image
   - Upload `Sucar.png`
   - Set size to 1024x1024
   - Download and save as `mobile/assets/icon.png`

3. **Using Command Line (ImageMagick):**
   ```powershell
   # Install ImageMagick first, then:
   magick convert mobile/assets/Sucar.png -resize 1024x1024^ -gravity center -extent 1024x1024 mobile/assets/icon.png
   ```

### Option 2: Use Default Icon (Temporary)

For now, Expo will use a default icon. The app will work, but won't have your custom icon.

### Option 3: Use Sucar.png with Padding

Add padding to make it square:

1. Open `Sucar.png` in image editor
2. Create new 1024x1024 canvas with transparent background
3. Center the SuCAR logo
4. Save as `icon.png`

## 📋 Icon Requirements

- **Size:** 1024x1024 pixels (square)
- **Format:** PNG
- **Location:** `mobile/assets/icon.png`
- **Background:** Transparent or solid color

## 🎨 Android Adaptive Icon

For Android, you also need:
- **Foreground:** `icon.png` (1024x1024)
- **Background:** Color `#667eea` (already configured)

## ✅ After Creating Icon

1. Place `icon.png` in `mobile/assets/` folder
2. Run `npx expo-doctor` to verify
3. Should see: "All checks passed"

## 🚀 Quick Fix (Temporary)

If you want to proceed without custom icon for now:

The app will work fine, Expo will just use a default icon. You can add a custom icon later.

---

**Note:** The app is fully functional without a custom icon. This is just for branding/appearance.
