# Testing the Dashboards

## 🚀 Quick Start

### 1. Access the Application
Open your browser and go to: **http://localhost:5173**

### 2. Create Test Users

#### Option A: Register via UI
1. Click "Register" or go to `/register`
2. Select the role you want to test:
   - **Car Wash**: Select "Car Wash" role
   - **Admin**: Select "Admin" role (or create manually - see below)

#### Option B: Create Admin User Manually
Since admin registration might be restricted, create an admin user directly in Supabase:

1. Open Supabase Studio: http://127.0.0.1:54326
2. Go to Table Editor → `users` table
3. Click "Insert row" and add:
   ```sql
   name: Admin User
   email: admin@sucar.com
   password: (use bcrypt hash - see below)
   phone: 1234567890
   nrc: ADMIN001
   role: admin
   is_active: true
   ```

   **To hash password:**
   - Use online bcrypt tool: https://bcrypt-generator.com/
   - Or use Node.js: `bcrypt.hash('password123', 10)`
   - Default test password hash: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` (password: `password123`)

### 3. Login and Access Dashboards

#### Car Wash Dashboard
1. Register/Login with Car Wash role
2. After login, you'll be redirected to `/carwash`
3. Dashboard shows:
   - Total Bookings
   - Pending Bookings
   - In Progress Bookings
   - Completed Bookings
   - Total Revenue

4. Navigate to:
   - **Bookings**: View and update booking status
   - **Manage Services**: Add/edit services and pricing

#### Admin Dashboard
1. Login with Admin account
2. After login, you'll be redirected to `/admin`
3. Dashboard shows:
   - Total Bookings
   - Pending Pickups
   - Completed Washes
   - Total Revenue
   - Total Clients
   - Total Drivers
   - Total Car Washes

4. Navigate to:
   - **Manage Drivers**: View and manage driver accounts
   - **Manage Bookings**: View all bookings and assign drivers
   - **Reports**: View revenue and performance reports

## 🧪 Testing Workflow

### Complete Test Flow

1. **Register as Car Wash**
   - Go to `/register`
   - Select "Car Wash" role
   - Fill in details (Car Wash Name, Location, Washing Bays)
   - Register and login

2. **Add Services**
   - Go to "Manage Services"
   - Add services like:
     - Full Basic Wash - K50.00
     - Engine Wash - K75.00
     - Exterior Wash - K40.00
     - Interior Wash - K60.00
     - Wax and Polishing - K100.00

3. **Register as Client**
   - Logout and register as "Client"
   - Add a vehicle
   - Create a booking selecting your Car Wash

4. **View in Car Wash Dashboard**
   - Logout and login as Car Wash
   - Go to "Bookings"
   - See the new booking
   - Update status: `at_wash` → `waiting_bay` → `washing_bay` → `drying_bay` → `wash_completed`

5. **View in Admin Dashboard**
   - Logout and login as Admin
   - Go to `/admin`
   - See all bookings, users, and reports

## 📊 Dashboard Features to Test

### Car Wash Dashboard
- ✅ View dashboard statistics
- ✅ View incoming bookings
- ✅ Update booking status
- ✅ Manage services (add/edit/delete)
- ✅ View service pricing

### Admin Dashboard
- ✅ View system-wide statistics
- ✅ Manage all users (clients, drivers, car washes)
- ✅ View all bookings
- ✅ Assign drivers to bookings
- ✅ View revenue reports
- ✅ View driver performance

## 🔍 Troubleshooting

### Can't Access Dashboard
- Check if backend is running: http://localhost:5000/api/health
- Check if frontend is running: http://localhost:5173
- Check browser console for errors

### Login Issues
- Verify user exists in database (Supabase Studio)
- Check password is correctly hashed
- Verify role is set correctly

### No Data Showing
- Create test data:
  - Register users
  - Create bookings
  - Add services (for Car Wash)

### API Errors
- Check backend terminal for errors
- Verify Supabase is running: `npx supabase status`
- Check `.env` file has correct Supabase URL and key

## 🎯 Quick Test Checklist

- [ ] Frontend loads at http://localhost:5173
- [ ] Can register as Car Wash
- [ ] Can login as Car Wash
- [ ] Car Wash dashboard shows statistics
- [ ] Can add services
- [ ] Can view bookings
- [ ] Can register as Admin (or create manually)
- [ ] Can login as Admin
- [ ] Admin dashboard shows statistics
- [ ] Can view all users
- [ ] Can view all bookings
- [ ] Can view reports

## 📝 Notes

- **Default Test Credentials** (if created manually):
  - Admin: `admin@sucar.com` / `password123`
  - Car Wash: Register via UI
  - Client: Register via UI
  - Driver: Register via UI

- **Dashboard URLs**:
  - Admin: http://localhost:5173/admin
  - Car Wash: http://localhost:5173/carwash
  - Client: http://localhost:5173/client
  - Driver: http://localhost:5173/driver

- **Real-time Updates**: Refresh page to see latest data (or implement real-time subscriptions)

Enjoy testing! 🎉
