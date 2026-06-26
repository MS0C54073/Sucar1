# SuCAR Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install MongoDB
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **macOS**: `brew install mongodb-community && brew services start mongodb-community`
- **Linux**: `sudo apt-get install mongodb && sudo systemctl start mongodb`

### Step 2: Start Backend
```bash
cd backend
npm install
# Create .env file (see backend/.env.example)
npm run dev
```
✅ Backend running on http://localhost:5000

### Step 3: Start Web Dashboard
```bash
cd frontend
npm install
npm run dev
```
✅ Dashboard running on http://localhost:3000

### Step 4: Start Mobile App
```bash
cd mobile
npm install
# Update API_URL in mobile/src/context/AuthContext.tsx
npm start
```
✅ Press `i` for iOS or `a` for Android

## 📱 Mobile API Configuration

**For Android Emulator:**
```typescript
const API_URL = 'http://10.0.2.2:5000/api';
```

**For iOS Simulator:**
```typescript
const API_URL = 'http://localhost:5000/api';
```

**For Physical Device:**
```typescript
const API_URL = 'http://YOUR_COMPUTER_IP:5000/api';
```

## 🧪 Test the System

1. **Register as Client** (Mobile App)
   - Open mobile app
   - Register with role "Client"
   - Add a vehicle

2. **Register as Car Wash** (Mobile App or Web)
   - Register with role "Car Wash"
   - Login to web dashboard at /carwash
   - Add services with prices

3. **Register as Driver** (Mobile App)
   - Register with role "Driver"
   - Login to mobile app

4. **Create Booking** (Client Mobile App)
   - Select car wash
   - Select service
   - Select vehicle
   - Create booking

5. **Accept Booking** (Driver Mobile App)
   - View assigned bookings
   - Accept booking
   - Update status as you progress

6. **Update Wash Status** (Car Wash Web Dashboard)
   - Login to /carwash
   - View bookings
   - Update status: Waiting Bay → Washing Bay → Drying Bay → Done

7. **Admin Dashboard** (Web)
   - Create admin user in database
   - Login to /admin
   - View all bookings, manage drivers, view reports

## 🎯 Key Features to Test

- ✅ User registration and login
- ✅ Vehicle management (Client)
- ✅ Booking creation (Client)
- ✅ Driver acceptance (Driver)
- ✅ Status updates (Driver & Car Wash)
- ✅ Service management (Car Wash)
- ✅ Admin dashboard (Admin)
- ✅ Real-time status tracking

## 📚 Full Documentation

See `README.md` for complete documentation and `SETUP.md` for detailed setup instructions.
