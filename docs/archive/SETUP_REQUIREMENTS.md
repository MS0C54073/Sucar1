# SuCAR System Setup Requirements

## ✅ What You Need to Provide

### 1. **Mapbox API Token** (REQUIRED for Maps)
The system uses Mapbox GL JS for all mapping features. You need to:

1. **Sign up for a free Mapbox account**: https://account.mapbox.com/signup/
2. **Get your access token**: 
   - Go to https://account.mapbox.com/access-tokens/
   - Copy your **Default Public Token** (starts with `pk.eyJ...`)
3. **Update the token in the code**:
   - File: `frontend/src/components/MapView.tsx` (line 12)
   - File: `frontend/src/components/LocationPicker.tsx` (line 7)
   - Replace: `const MAPBOX_TOKEN = 'your-token-here';`

**OR** (Better approach) - Use environment variable:
- Create `frontend/.env` file:
  ```
  VITE_MAPBOX_TOKEN=your-mapbox-token-here
  ```
- Update the code to use: `const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'fallback-token';`

### 2. **Supabase Database** (REQUIRED)
The system uses Supabase (PostgreSQL) for data storage.

1. **Create a Supabase project**: https://supabase.com/dashboard
2. **Get your connection details**:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for backend)
3. **Run database migrations**:
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL files in this order:
     1. `backend/supabase-schema.sql` (or `supabase/migrations/20240101000000_initial_schema.sql`)
     2. `backend/migrations/add-user-approval-fields.sql` (if not already in schema)
     3. `RUN_THIS_NOW.sql` (to fix services constraint)
     4. `FIX_BOOKING_TYPE_AND_CACHE.sql` (to add booking_type column)
4. **Set environment variables** in `backend/.env`:
   ```
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 3. **Backend Environment Variables** (REQUIRED)
Create `backend/.env` file with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS (if needed)
CORS_ORIGIN=http://localhost:5173
```

### 4. **Frontend Environment Variables** (OPTIONAL but Recommended)
Create `frontend/.env` file with:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Mapbox Token (if using env variable)
VITE_MAPBOX_TOKEN=your-mapbox-token-here
```

### 5. **Install Dependencies**
Make sure all packages are installed:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 6. **Run Database Seed Script** (OPTIONAL - for test data)
If you want sample data:

```bash
cd backend
npm run seed
# or
node scripts/seed-data.js
```

### 7. **Start the Servers**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# or
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🔍 Quick Checklist

- [ ] Mapbox account created and token obtained
- [ ] Mapbox token added to code or `.env` file
- [ ] Supabase project created
- [ ] Database migrations run in Supabase SQL Editor
- [ ] Backend `.env` file created with Supabase credentials
- [ ] JWT_SECRET set in backend `.env`
- [ ] Frontend `.env` file created (optional)
- [ ] Dependencies installed (`npm install` in both folders)
- [ ] Backend server running (port 5000)
- [ ] Frontend dev server running (usually port 5173)

## 🚨 Common Issues

### Maps Not Loading
- **Issue**: Mapbox token invalid or missing
- **Fix**: Get a valid token from Mapbox and update the code

### Database Errors
- **Issue**: Missing columns or constraints
- **Fix**: Run all SQL migration files in Supabase SQL Editor

### Authentication Not Working
- **Issue**: JWT_SECRET not set or Supabase keys incorrect
- **Fix**: Check backend `.env` file has correct values

### API Connection Errors
- **Issue**: Backend not running or wrong URL
- **Fix**: Ensure backend is running on port 5000, check `VITE_API_URL` in frontend

## 📝 Notes

- **Mapbox Free Tier**: 50,000 map loads/month (should be enough for development)
- **Supabase Free Tier**: 500MB database, 2GB bandwidth (good for development)
- The current Mapbox token in the code may be a demo token - replace it with your own for production

## 🆘 Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Check backend terminal for error messages
3. Verify all environment variables are set correctly
4. Ensure all database migrations have been run
