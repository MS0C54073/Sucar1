# 🚀 Local Supabase - Quick Start

## ✅ Setup Complete!

Supabase is configured to run locally. Here's how to use it:

## 📋 Commands

### Start Supabase Locally
```bash
npx supabase start
```

This will:
- ✅ Download Docker images (first time only)
- ✅ Start PostgreSQL database
- ✅ Start Supabase Studio (web UI)
- ✅ Start API server
- ✅ **Automatically run migrations** (creates all tables!)

### Stop Supabase
```bash
npx supabase stop
```

### Check Status
```bash
npx supabase status
```

This shows:
- API URL
- Studio URL
- Database connection string
- Anon key
- Service role key

## 🔗 Access Points

After starting, you'll see:

- **API URL**: http://localhost:54325
- **Studio URL**: http://localhost:54326
- **Database**: postgresql://postgres:postgres@localhost:54323/postgres

## ⚙️ Update Backend Configuration

After Supabase starts, update `backend/.env`:

```env
# Local Supabase
SUPABASE_URL=http://localhost:54325
SUPABASE_ANON_KEY=your-local-anon-key-from-status

# Or use direct database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:54323/postgres
```

**Get the keys by running:**
```bash
npx supabase status
```

## ✅ Automatic Table Creation

When you run `supabase start`, it will:
1. ✅ Run all migrations in `supabase/migrations/`
2. ✅ Create all tables automatically
3. ✅ Set up indexes and triggers
4. ✅ Be ready to use!

## 🎯 Next Steps

1. **Start Supabase**: `npx supabase start`
2. **Copy connection details** from the output
3. **Update backend/.env** with local URLs
4. **Start backend**: `cd backend && npm run dev`
5. **Open Studio**: http://localhost:54326 (to view tables)

## 📊 Verify Tables

After starting, open Supabase Studio:
- Go to: http://localhost:54326
- Click: **Table Editor**
- You should see all 5 tables!

## 🆘 Troubleshooting

### Port conflicts
If ports are in use, update `supabase/config.toml` with different ports.

### Docker not running
Make sure Docker Desktop is running.

### Reset everything
```bash
npx supabase stop
npx supabase db reset
npx supabase start
```

---

**That's it!** Your local Supabase is ready with automatic table creation! 🎉
