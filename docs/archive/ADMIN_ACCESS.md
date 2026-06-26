# How to Access Admin Dashboard

## Quick Method: Create Admin User via Script

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Run the admin creation script:**
   ```bash
   node scripts/create-admin.js admin@sucar.com password123 "Admin User" "1234567890" "ADMIN001"
   ```

   Replace the values with your desired:
   - Email: `admin@sucar.com`
   - Password: `password123`
   - Name: `Admin User`
   - Phone: `1234567890`
   - NRC: `ADMIN001`

3. **Login with the admin credentials:**
   - Go to: http://localhost:5173/login
   - Enter the email and password you used
   - You'll be automatically redirected to `/admin`

## Alternative Method: Create Admin via Supabase Studio

1. **Open Supabase Studio:**
   - Go to: http://127.0.0.1:54326 (or your local Supabase Studio URL)
   - Or use: `npx supabase studio`

2. **Navigate to Table Editor:**
   - Click on "Table Editor" in the left sidebar
   - Select the `users` table

3. **Insert a new row:**
   - Click "Insert row" button
   - Fill in the following fields:
     ```
     name: Admin User
     email: admin@sucar.com
     password: (use bcrypt hash - see below)
     phone: 1234567890
     nrc: ADMIN001
     role: admin
     is_active: true
     ```

4. **Hash the password:**
   - Use an online bcrypt generator: https://bcrypt-generator.com/
   - Or use Node.js:
     ```javascript
     const bcrypt = require('bcryptjs');
     bcrypt.hash('password123', 10).then(hash => console.log(hash));
     ```
   - Or use the pre-hashed value for `password123`:
     ```
     $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
     ```

5. **Save the row**

6. **Login:**
   - Go to: http://localhost:5173/login
   - Use the email and password you set

## Alternative Method: Create Admin via SQL

1. **Open Supabase SQL Editor:**
   - Go to: http://127.0.0.1:54326
   - Click on "SQL Editor"

2. **Run this SQL (replace values as needed):**
   ```sql
   INSERT INTO users (name, email, password, phone, nrc, role, is_active)
   VALUES (
     'Admin User',
     'admin@sucar.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: password123
     '1234567890',
     'ADMIN001',
     'admin',
     true
   );
   ```

3. **Login with:**
   - Email: `admin@sucar.com`
   - Password: `password123`

## Accessing the Admin Dashboard

Once you have an admin account:

1. **Login:**
   - Go to: http://localhost:5173/login
   - Enter your admin email and password
   - Click "Sign In"

2. **You'll be automatically redirected to:**
   - `/admin` - Admin Dashboard

3. **Admin Dashboard Features:**
   - View all bookings
   - Manage drivers
   - Manage car wash providers
   - View reports and analytics
   - System-wide monitoring

## Default Test Credentials

If you used the script or SQL above, you can login with:
- **Email:** `admin@sucar.com`
- **Password:** `password123`

⚠️ **Important:** Change the password after first login in production!

## Troubleshooting

### "Invalid credentials" error
- Verify the user was created in the database
- Check that `is_active` is set to `true`
- Ensure the password hash is correct

### Can't access `/admin` route
- Verify your user role is `admin` in the database
- Check browser console for errors
- Verify backend is running

### Script doesn't work
- Ensure you're in the `backend` directory
- Check that `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify Supabase is running: `npx supabase status`
