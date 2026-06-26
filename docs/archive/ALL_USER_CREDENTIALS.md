# SuCAR System - User Credentials

## ⚠️ Security Note

**Important**: This document contains test credentials for development only. In production:
- Passwords are hashed and cannot be retrieved
- Never share or commit real user passwords
- Use secure password reset mechanisms

---

## 📋 Test/Seed Data Credentials

These are the credentials for users created by the seed data script. These are **test accounts only**.

### 📱 Clients (5 users)

| # | Name | Email | Password | Role |
|---|------|-------|----------|------|
| 1 | John Mwansa | john.mwansa@email.com | `client123` | Client |
| 2 | Sarah Banda | sarah.banda@email.com | `client123` | Client |
| 3 | Peter Phiri | peter.phiri@email.com | `client123` | Client |
| 4 | Mary Tembo | mary.tembo@email.com | `client123` | Client |
| 5 | David Ngoma | david.ngoma@email.com | `client123` | Client |

### 🧼 Car Washes (10 users)

| # | Name | Email | Password | Location |
|---|------|-------|----------|----------|
| 1 | Sparkle Auto Wash | sparkle@carwash.com | `carwash123` | Cairo Road, Lusaka |
| 2 | Crystal Clean Car Wash | crystal@carwash.com | `carwash123` | Great East Road, Lusaka |
| 3 | Shine Bright Car Care | shine@carwash.com | `carwash123` | Makeni Road, Lusaka |
| 4 | Premium Wash Center | premium@carwash.com | `carwash123` | Woodlands, Lusaka |
| 5 | Quick Wash Express | quick@carwash.com | `carwash123` | Kabulonga, Lusaka |
| 6 | Elite Car Spa | elite@carwash.com | `carwash123` | Roma, Lusaka |
| 7 | Auto Shine Pro | autoshine@carwash.com | `carwash123` | Northmead, Lusaka |
| 8 | Mega Wash Hub | mega@carwash.com | `carwash123` | Chilenje, Lusaka |
| 9 | Spotless Auto Care | spotless@carwash.com | `carwash123` | Libala, Lusaka |
| 10 | Ultra Clean Services | ultra@carwash.com | `carwash123` | Chainda, Lusaka |

### 🚗 Drivers (10 users)

| # | Name | Email | Password | Rating | Jobs |
|---|------|-------|----------|--------|------|
| 1 | James Mulenga | james.mulenga@driver.com | `driver123` | 4.8/5.0 | 150 |
| 2 | Michael Chanda | michael.chanda@driver.com | `driver123` | 4.5/5.0 | 120 |
| 3 | Robert Mwanza | robert.mwanza@driver.com | `driver123` | 4.9/5.0 | 200 |
| 4 | Thomas Banda | thomas.banda@driver.com | `driver123` | 4.2/5.0 | 80 |
| 5 | Andrew Phiri | andrew.phiri@driver.com | `driver123` | 4.7/5.0 | 180 |
| 6 | Daniel Tembo | daniel.tembo@driver.com | `driver123` | 4.6/5.0 | 140 |
| 7 | Mark Ngoma | mark.ngoma@driver.com | `driver123` | 4.4/5.0 | 100 |
| 8 | Paul Mwila | paul.mwila@driver.com | `driver123` | 4.3/5.0 | 90 |
| 9 | Steven Lungu | steven.lungu@driver.com | `driver123` | 4.9/5.0 | 220 |
| 10 | Brian Mbewe | brian.mbewe@driver.com | `driver123` | 4.1/5.0 | 70 |

---

## 🔐 Admin Account

### Default Admin Credentials

If you've created an admin account using the scripts:

**Default Admin:**
- **Email**: `admin@sucar.com` (or as configured)
- **Password**: `admin123` (default, should be changed)

### Create/Reset Admin Account

To create or reset an admin account:

```bash
cd backend
node scripts/reset-admin-password.js
```

Or create a new admin:

```bash
node scripts/create-admin.js admin@example.com password123 "Admin Name" "1234567890" "ADMIN001"
```

---

## 📊 View All Users in Database

### Option 1: Using Supabase Studio

1. Open Supabase Studio: http://localhost:54326
2. Go to **Table Editor** → **users**
3. View all users (passwords are hashed and not readable)

### Option 2: Using SQL Query

Run this in Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM users
ORDER BY role, created_at;
```

**Note**: Passwords are hashed using bcrypt and cannot be retrieved in plain text.

---

## 🔄 View All Users via API

### Get All Users (Admin Only)

```bash
# Get authentication token first by logging in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sucar.com","password":"admin123"}'

# Use the token to get all users
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🆕 Create New Test Users

### Run Seed Data Script

This creates all test users above:

```bash
cd backend
npm run seed
```

Or directly:

```bash
node scripts/seed-data.js
```

This will:
- Create 5 clients
- Create 10 car washes
- Create 10 drivers
- Generate credentials and save to `SEED_DATA_CREDENTIALS.md`

---

## 🔒 Security Best Practices

1. **Never commit passwords** to version control
2. **Change default passwords** in production
3. **Use strong passwords** for admin accounts
4. **Enable 2FA** for production (if implemented)
5. **Regularly audit** user accounts
6. **Hash all passwords** (already implemented with bcrypt)

---

## 📝 Notes

- All seed data passwords are simple for testing: `client123`, `carwash123`, `driver123`
- Admin default password: `admin123`
- Passwords in the database are hashed using bcrypt (10 salt rounds)
- You cannot retrieve original passwords from the database
- To reset a password, use the password reset functionality or update directly in the database (with a new hash)

---

## 🎯 Quick Login URLs

- **Frontend Login**: http://localhost:5173/login
- **Backend API**: http://localhost:5000/api
- **Supabase Studio**: http://localhost:54326

---

**Last Updated**: Generated from seed data script
**Environment**: Development/Testing Only
