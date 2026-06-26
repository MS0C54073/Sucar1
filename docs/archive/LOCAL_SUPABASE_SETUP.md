# 🚀 Running Supabase Locally

## Quick Start

### 1. Install Supabase CLI

```bash
# Using npm (recommended)
npm install -g supabase

# Or using scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Initialize Supabase (if not already done)

```bash
cd backend
supabase init
```

### 3. Start Supabase Locally

```bash
supabase start
```

This will:
- ✅ Start PostgreSQL database
- ✅ Start Supabase Studio (web UI)
- ✅ Start API server
- ✅ Start Auth server
- ✅ Run all migrations automatically

### 4. Access Local Supabase

After starting, you'll see connection details:

- **API URL**: http://localhost:54321
- **Studio URL**: http://localhost:54323
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Anon Key**: (shown in terminal)
- **Service Role Key**: (shown in terminal)

### 5. Update Backend Configuration

Update `backend/.env`:

```env
# Local Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key-from-terminal

# Or use direct database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### 6. Start Backend

```bash
cd backend
npm run dev
```

The backend will automatically:
- ✅ Connect to local Supabase
- ✅ Run migrations
- ✅ Create all tables
- ✅ Be ready to use!

## 📋 Useful Commands

```bash
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

# Check status
supabase status
```

## 🎯 Access Points

- **Supabase Studio**: http://localhost:54323
  - Visual database editor
  - Table management
  - SQL editor
  - Auth management

- **API**: http://localhost:54321
  - Same as production Supabase API
  - Use with your backend

- **Database**: localhost:54322
  - Direct PostgreSQL access
  - Username: postgres
  - Password: postgres

## 🔄 Migrations

Migrations are in `supabase/migrations/` and run automatically when you start Supabase.

To create a new migration:
```bash
supabase migration new migration_name
```

## ✅ Verify Setup

1. Start Supabase: `supabase start`
2. Open Studio: http://localhost:54323
3. Check Tables section - you should see:
   - users
   - vehicles
   - services
   - bookings
   - payments

## 🆘 Troubleshooting

### Port already in use
```bash
# Stop Supabase first
supabase stop

# Or change ports in supabase/config.toml
```

### Docker not running
Supabase requires Docker. Make sure Docker Desktop is running.

### Reset everything
```bash
supabase stop
supabase db reset
supabase start
```

## 🎉 That's It!

Your local Supabase is now running and ready to use!
