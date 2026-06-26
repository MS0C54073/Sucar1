# SUKA Car Wash System - Complete Setup Guide

## 🎯 System Overview

**SUKA (SuCAR)** is a complete cross-platform car wash booking system with:
- ✅ **Flutter Mobile App** (iOS & Android) - For Clients and Drivers
- ✅ **Next.js Dashboard** (Web) - For Admin and Car Wash operators
- ✅ **Node.js Backend API** - RESTful API with MongoDB
- ✅ **Shared Types Package** - Common data models

## 📦 Project Structure

```
Sucar/
├── backend/              # Node.js API (Port 5000)
├── mobile-flutter/       # Flutter app (iOS & Android)
├── dashboard-nextjs/     # Next.js dashboard (Port 3000)
└── shared-types/         # Shared TypeScript types
```

## 🚀 Quick Setup

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/sucar
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
NODE_ENV=development" > .env

npm run dev
```

✅ Backend running on `http://localhost:5000`

### 2. Flutter Mobile App Setup

**Prerequisites:**
- Flutter SDK 3.0.0+
- Android Studio / Xcode

```bash
cd mobile-flutter
flutter pub get
```

**Configure API URL** in `lib/services/api_service.dart`:
- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Physical Device: `http://YOUR_IP:5000/api`

**Run:**
```bash
# Android
flutter run

# iOS (macOS only)
flutter run -d ios
```

### 3. Next.js Dashboard Setup

```bash
cd dashboard-nextjs
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

npm run dev
```

✅ Dashboard running on `http://localhost:3000`

## 📱 Cross-Platform Support

### Mobile App (Flutter)
- ✅ **iOS**: Native iOS app
- ✅ **Android**: Native Android app
- ✅ **Single Codebase**: One Flutter project for both platforms

### Dashboard (Next.js)
- ✅ **Web**: Browser-based dashboard
- ✅ **Responsive**: Works on all screen sizes

## 🎨 Client Interface

The **Client interface** is in the Flutter mobile app:
- `lib/screens/client/` - All client screens
- Features:
  - Register/Login
  - Book car wash pickup
  - Select driver and car wash
  - Track booking status
  - Manage vehicles

## 🔧 Shared Types

Common data models in `shared-types/`:
- `Booking` - Booking status and details
- `User` - User roles (client, driver, carwash, admin)
- `Vehicle` - Vehicle information
- `Service` - Car wash services
- `VehicleStatus` - Status enumeration helpers

## 📊 User Roles

1. **Client** (Mobile App)
   - Book car washes
   - Manage vehicles
   - Track bookings

2. **Driver** (Mobile App)
   - Accept bookings
   - Update pickup/delivery status

3. **Car Wash** (Dashboard)
   - Manage services
   - Update wash status
   - View bookings

4. **Admin** (Dashboard)
   - Manage drivers
   - Manage bookings
   - View reports

## 🧪 Testing

### Test on Android Emulator
1. Start Android Studio
2. Create/Start AVD
3. Run `flutter run` in `mobile-flutter/`

### Test on iOS Simulator (macOS)
1. Open Xcode
2. Start iOS Simulator
3. Run `flutter run -d ios` in `mobile-flutter/`

### Test Dashboard
1. Start backend: `cd backend && npm run dev`
2. Start dashboard: `cd dashboard-nextjs && npm run dev`
3. Open `http://localhost:3000`

## 📚 Documentation

- **Backend**: See `backend/README.md`
- **Mobile App**: See `mobile-flutter/README.md`
- **Dashboard**: See `dashboard-nextjs/README.md`
- **Project Structure**: See `PROJECT_STRUCTURE.md`

## 🔗 API Integration

All components connect to the same backend:
- **Backend**: `http://localhost:5000/api`
- **Mobile**: Configured in `api_service.dart`
- **Dashboard**: Configured in `next.config.js`

## ✅ Features Implemented

- ✅ Cross-platform mobile app (iOS & Android)
- ✅ Web dashboard (Admin & Car Wash)
- ✅ Client interface for booking
- ✅ Driver interface for accepting bookings
- ✅ Real-time status tracking
- ✅ Shared types for consistency
- ✅ Role-based access control
