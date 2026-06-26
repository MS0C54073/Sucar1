# 🚀 Start Supabase Locally

## Quick Start

### Step 1: Start Docker Desktop

**Supabase requires Docker Desktop to be running.**

1. Open **Docker Desktop** application
2. Wait for it to fully start (you'll see a whale icon in your system tray)
3. Make sure it shows "Docker Desktop is running"

### Step 2: Start Supabase

**Option A: Use the PowerShell script (Recommended)**
```powershell
.\start-supabase.ps1
```

**Option B: Manual start**
```powershell
supabase start
```

### Step 3: Get Connection Details

After Supabase starts, you'll see output like:
```
API URL: http://localhost:54325
Studio URL: http://localhost:54326
DB URL: postgresql://postgres:postgres@localhost:54323/postgres
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### Step 4: Update Backend Configuration

Update `backend/.env` with the local Supabase details:

```env
# Local Supabase
SUPABASE_URL=http://localhost:54325
SUPABASE_ANON_KEY=your_anon_key_from_status_output
```

**To get the keys, run:**
```powershell
supabase status
```

### Step 5: Start Backend

```powershell
cd backend
npm run dev
```

## 📋 Useful Commands

```powershell
# Check Supabase status
supabase status

# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (delete all data)
supabase db reset

# View logs
supabase logs

# Open Studio (web UI)
supabase studio
```

## 🔗 Access Points

- **Supabase Studio**: http://localhost:54326
  - Visual database editor
  - Table management
  - SQL editor

- **API**: http://localhost:54325
  - Same as production Supabase API
  - Use with your backend

- **Database**: localhost:54323
  - Direct PostgreSQL access
  - Username: `postgres`
  - Password: `postgres`

## ✅ Verify Setup

1. Start Supabase: `supabase start`
2. Open Studio: http://localhost:54326
3. Check Tables section - you should see all your tables

## 🆘 Troubleshooting

### Docker Desktop Not Running
- **Error**: `The system cannot find the file specified`
- **Solution**: Start Docker Desktop and wait for it to fully start

### Port Already in Use
- **Error**: `port is already allocated`
- **Solution**: 
  ```powershell
  supabase stop
  # Or change ports in supabase/config.toml
  ```

### Reset Everything
```powershell
supabase stop
supabase db reset
supabase start
```

## 🎉 That's It!

Once Supabase is running, your backend will automatically connect to it!
