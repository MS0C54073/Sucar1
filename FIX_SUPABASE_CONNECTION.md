# 🔧 Fix Supabase Connection Error

## Current Problem

Your backend is trying to connect to **local Supabase** at `http://127.0.0.1:54325`, but Supabase is not running.

**Error**: `ECONNREFUSED 127.0.0.1:54325`

## Solution Options

### Option 1: Start Local Supabase (Recommended for Development)

**Step 1: Start Docker Desktop**
1. Open **Docker Desktop** application
2. Wait for it to fully start (whale icon in system tray)
3. Make sure it shows "Docker Desktop is running"

**Step 2: Start Supabase**
```powershell
# From project root
.\start-supabase.ps1

# OR manually
cd backend
supabase start
```

**Step 3: Update .env (if needed)**
After Supabase starts, check the connection details:
```powershell
supabase status
```

Copy the `anon key` and update `backend/.env`:
```env
SUPABASE_URL=http://localhost:54325
SUPABASE_ANON_KEY=your_anon_key_from_status_output
```

**Step 4: Restart Backend**
```powershell
cd backend
npm run dev
```

### Option 2: Use Remote Supabase (Quick Fix)

If you have a remote Supabase project, update `backend/.env`:

```env
# Remote Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_remote_anon_key
```

**To get these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

## Quick Check Commands

```powershell
# Check if Docker is running
docker ps

# Check Supabase status
cd backend
supabase status

# Check current .env configuration
cd backend
Get-Content .env | Select-String "SUPABASE"
```

## Expected Output After Fix

When connection is successful, you should see:
```
🔄 Testing Supabase connection...
📍 URL: http://localhost:54325
✅ Supabase connected successfully
📍 Connected to: http://localhost:54325
```

## Still Having Issues?

1. **Docker not starting?**
   - Make sure Docker Desktop is installed
   - Restart Docker Desktop
   - Check Windows WSL2 is enabled (if using WSL2 backend)

2. **Port already in use?**
   - Check if another Supabase instance is running: `supabase status`
   - Stop it: `supabase stop`
   - Or change ports in `supabase/config.toml`

3. **Connection still failing?**
   - Verify `.env` file exists in `backend/` directory
   - Check environment variables are correct
   - Try restarting your terminal/IDE after updating `.env`
