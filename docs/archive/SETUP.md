# SuCAR Setup Guide

## Quick Start

### 1. Install MongoDB

**Windows:**
- Download MongoDB Community Server from https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sucar
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup (Web Dashboard)

```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:3000

### 4. Mobile App Setup

```bash
cd mobile
npm install
```

**Important:** Update API URL in `mobile/src/context/AuthContext.tsx`:

For Android Emulator:
```typescript
const API_URL = 'http://10.0.2.2:5000/api';
```

For iOS Simulator:
```typescript
const API_URL = 'http://localhost:5000/api';
```

For Physical Device (use your computer's IP):
```typescript
const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
```

Start Expo:
```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Testing with Emulators

### Android Studio Setup

1. Download Android Studio: https://developer.android.com/studio
2. Install Android SDK and create an AVD (Android Virtual Device)
3. Start the emulator
4. In mobile directory, run: `npm run android`

### iOS Simulator Setup (macOS only)

1. Install Xcode from App Store
2. Open Xcode → Preferences → Components → Download iOS Simulator
3. In mobile directory, run: `npm run ios`

## Creating Test Users

### Admin User (via MongoDB or API)

You can create an admin user directly in MongoDB:

```javascript
// Connect to MongoDB
use sucar

// Create admin user (password will be hashed automatically)
db.users.insertOne({
  name: "Admin User",
  email: "admin@sucar.com",
  password: "$2a$10$...", // Use bcrypt to hash "password123"
  phone: "1234567890",
  nrc: "123456/78/9",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use the registration API and manually update role in database.

## Default Test Credentials

After creating users, you can test with:
- **Admin**: admin@sucar.com / password123
- **Client**: client@test.com / password123
- **Driver**: driver@test.com / password123
- **Car Wash**: carwash@test.com / password123

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Ensure MongoDB is running
- **Port Already in Use**: Change PORT in .env file
- **Module Not Found**: Run `npm install` again

### Frontend Issues

- **API Connection Error**: Check backend is running on port 5000
- **CORS Error**: Backend CORS is configured, check backend is running

### Mobile Issues

- **Cannot Connect to API**: Update API_URL in AuthContext.tsx
- **Expo Not Starting**: Clear cache with `expo start -c`
- **Android Emulator Issues**: Ensure emulator is running before `npm run android`
- **iOS Simulator Issues**: Ensure Xcode is installed and simulator is running

## Network Configuration for Mobile

### Finding Your IP Address

**Windows:**
```cmd
ipconfig
```
Look for IPv4 Address (e.g., 192.168.1.100)

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```
Look for inet address (e.g., 192.168.1.100)

### Firewall Configuration

Ensure port 5000 is open for mobile device connections:
- Windows: Allow Node.js through Windows Firewall
- macOS: System Preferences → Security → Firewall → Allow Node.js

## Production Deployment

### Backend
- Use environment variables for all secrets
- Set NODE_ENV=production
- Use MongoDB Atlas or managed MongoDB
- Deploy to Heroku, Railway, or AWS

### Frontend
- Build with `npm run build`
- Deploy to Vercel, Netlify, or AWS S3

### Mobile
- Build with `expo build:android` or `expo build:ios`
- Submit to Google Play Store or App Store
