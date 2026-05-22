# 🔧 Credentials Fix - Database Connection Issue

## ❌ Current Problem

The credentials test is failing because **Supabase is not running locally**. All login requests return:
```
Database connection failed. Please check if Supabase is running.
```

---

## ✅ Solution Options

### Option 1: Fix Local Supabase (Recommended for Development)

**Step 1: Check Docker Desktop**

Make sure Docker Desktop is running:
1. Open Task Manager (Ctrl+Shift+Esc)
2. Look for "Docker Desktop" process
3. If not running, start it from your applications

Verify Docker is accessible:
```bash
docker ps
```

**Step 2: Start Supabase**

```bash
cd C:\Users\User\Desktop\Sucar
supabase start
```

This will take 2-3 minutes. Wait for output like:
```
API URL: http://localhost:54325
Studio URL: http://localhost:54326
```

**Step 3: Get Connection Details**

```bash
supabase status
```

Copy the `anon key` and update `backend/.env`:
```env
SUPABASE_ANON_KEY=your_key_here
```

**Step 4: Seed Database**

```bash
cd backend
npm run seed
```

Then test credentials:
```bash
node test-credentials.js
```

---

### Option 2: Use Remote Supabase Instance (Fast Alternative)

If Docker is having issues, use a Supabase cloud instance:

**Step 1: Create Free Account**
- Go to https://supabase.com/dashboard
- Sign up for free
- Create new project

**Step 2: Get Connection Keys**
- Copy Project URL
- Copy anon key (under Settings → API)

**Step 3: Update backend/.env**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
```

**Step 4: Run Migrations**

```bash
cd backend
npm run migrate:auto
```

**Step 5: Seed Database**

```bash
npm run seed
```

---

## 📋 All Mock Credentials

Once Supabase is running and seeded, use these credentials:

### Admin
```
Email: admin@sucar.com
Password: password123
```

### Clients (5)
```
john.mwansa@email.com / client123
sarah.banda@email.com / client123
peter.phiri@email.com / client123
mary.tembo@email.com / client123
david.ngoma@email.com / client123
```

### Car Washes (10)
```
sparkle@carwash.com / carwash123
crystal@carwash.com / carwash123
shine@carwash.com / carwash123
premium@carwash.com / carwash123
quick@carwash.com / carwash123
elite@carwash.com / carwash123
autoshine@carwash.com / carwash123
mega@carwash.com / carwash123
spotless@carwash.com / carwash123
ultra@carwash.com / carwash123
```

### Drivers (10)
```
james.mulenga@driver.com / driver123
michael.chanda@driver.com / driver123
robert.mwanza@driver.com / driver123
thomas.banda@driver.com / driver123
andrew.phiri@driver.com / driver123
daniel.tembo@driver.com / driver123
mark.ngoma@driver.com / driver123
paul.mwila@driver.com / driver123
steven.lungu@driver.com / driver123
brian.mbewe@driver.com / driver123
```

---

## 🧪 Test Credentials After Setup

```bash
cd backend
node test-credentials.js
```

Expected output:
```
--- ADMIN ---
✓ Admin User - Login successful

--- CLIENTS ---
✓ John Mwansa - Login successful
✓ Sarah Banda - Login successful
...

✅ ALL CREDENTIALS WORKING!
```

---

## 🐛 Troubleshooting

### Docker not found
```bash
# Check if installed
docker --version

# If not installed, download from:
# https://www.docker.com/products/docker-desktop
```

### Supabase command not found
```bash
# Install Supabase CLI
npm install -g supabase
```

### Port already in use
```bash
# Stop existing Supabase
supabase stop

# Or kill process on port 5000
taskkill /PID <PID> /F
```

### Still getting 500 errors
1. Check backend is running: `npm run dev`
2. Check Supabase is running: `supabase status`
3. Check connection string in `.env` is correct
4. Restart backend after any `.env` changes

---

## ✅ Next Steps (After Credentials Working)

1. Verify all users can login at http://localhost:5173/login
2. Start frontend: `npm run dev` (from frontend folder)
3. Test different roles (client, driver, car wash, admin)
4. Verify Phase 1 location features working
5. Proceed to Phase 2 (directions)

---
