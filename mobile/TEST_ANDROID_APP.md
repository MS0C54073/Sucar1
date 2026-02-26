# 🧪 Testing SuCAR Android App

## Quick Test Checklist

### ✅ Pre-Test Setup

1. **Backend Running**
   ```powershell
   cd backend
   npm run dev
   ```
   Verify: Open `http://localhost:5000/api/health` in browser

2. **Supabase Running**
   ```powershell
   .\start-supabase.ps1
   ```
   Or check: `cd backend && supabase status`

3. **Android Emulator Running**
   - Open Android Studio
   - Device Manager → Start emulator
   - Your emulator: Medium_Phone_API_36.1

4. **Test Users Created**
   ```powershell
   cd backend
   node scripts/seed-data.js
   ```

### 🧪 Test Scenarios

#### Test 1: Login Flow

**Steps:**
1. Open app in emulator
2. Enter email: `john.mwansa@email.com`
3. Enter password: `client123`
4. Tap "Login"

**Expected:**
- ✅ Login successful
- ✅ Navigate to Client Home screen
- ✅ Shows welcome message with user name

**Test with other roles:**
- Driver: `james.mulenga@driver.com` / `driver123`
- Admin: `admin@sucar.com` / `admin123`

#### Test 2: Registration Flow

**Steps:**
1. Tap "Don't have an account? Register"
2. Select role (Client/Driver/Car Wash)
3. Fill in required fields
4. Tap "Register"

**Expected:**
- ✅ Registration successful
- ✅ Auto-login after registration
- ✅ Navigate to appropriate home screen

#### Test 3: Client Features

**After logging in as Client:**

1. **View Home Screen**
   - ✅ Shows welcome message
   - ✅ Shows menu options (New Booking, My Bookings, My Vehicles)
   - ✅ Logout button works

2. **Create Booking**
   - ✅ Tap "New Booking"
   - ✅ Select vehicle
   - ✅ Select service
   - ✅ Select car wash
   - ✅ Create booking
   - ✅ Booking appears in "My Bookings"

3. **View Bookings**
   - ✅ Tap "My Bookings"
   - ✅ Shows list of bookings
   - ✅ Can view booking details

4. **Manage Vehicles**
   - ✅ Tap "My Vehicles"
   - ✅ Shows list of vehicles
   - ✅ Can add new vehicle
   - ✅ Can edit/delete vehicles

#### Test 4: Driver Features

**After logging in as Driver:**

1. **View Home Screen**
   - ✅ Shows driver dashboard
   - ✅ Shows assigned bookings

2. **Accept/Decline Bookings**
   - ✅ View pending bookings
   - ✅ Accept booking
   - ✅ Decline booking
   - ✅ Update booking status

3. **View Booking Details**
   - ✅ Tap on booking
   - ✅ Shows full booking information
   - ✅ Can update status

#### Test 5: Error Handling

**Test Network Errors:**
1. Stop backend server
2. Try to login
3. ✅ Should show clear error message

**Test Invalid Credentials:**
1. Enter wrong email/password
2. ✅ Should show "Invalid email or password"

**Test Validation Errors:**
1. Try to register with missing fields
2. ✅ Should show validation errors

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to server"

**Check:**
- ✅ Backend is running: `http://localhost:5000/api/health`
- ✅ API URL is `http://10.0.2.2:5000/api` (Android emulator)
- ✅ Emulator is running
- ✅ Windows Firewall allows Node.js

**Fix:**
```powershell
# Test backend
curl http://localhost:5000/api/health

# If not working, restart backend
cd backend
npm run dev
```

### Issue: Login fails

**Check:**
- ✅ Users exist in database
- ✅ Backend logs show login attempts
- ✅ Supabase is running
- ✅ See `../FIX_LOGIN_ISSUE.md`

**Fix:**
```powershell
# Create test users
cd backend
node scripts/seed-data.js
```

### Issue: App crashes

**Check:**
- ✅ Metro bundler logs
- ✅ All dependencies installed
- ✅ Backend is accessible

**Fix:**
```powershell
# Clear cache and restart
npm start -- --reset-cache
```

## 📊 Test Results Template

```
Test Date: ___________
Emulator: Medium_Phone_API_36.1
Backend: Running / Not Running
Supabase: Running / Not Running

✅ Login (Client): Pass / Fail
✅ Login (Driver): Pass / Fail
✅ Registration: Pass / Fail
✅ Client Home: Pass / Fail
✅ Create Booking: Pass / Fail
✅ View Bookings: Pass / Fail
✅ Manage Vehicles: Pass / Fail
✅ Driver Home: Pass / Fail
✅ Accept Booking: Pass / Fail
✅ Error Handling: Pass / Fail

Notes:
_________________________________
_________________________________
```

## 🎯 Success Criteria

All tests should pass:
- ✅ Login works for all roles
- ✅ Registration works
- ✅ Navigation works correctly
- ✅ Features work as expected
- ✅ Error messages are clear
- ✅ App doesn't crash
- ✅ Backend connection is stable

## 📝 Next Steps After Testing

If all tests pass:
1. ✅ App is ready for use
2. ✅ Can proceed with additional features
3. ✅ Can test on physical device

If tests fail:
1. Check error logs
2. See troubleshooting section
3. Check `ANDROID_SETUP_COMPLETE.md`
4. Verify backend and Supabase are running

---

**Happy Testing!** 🚀
