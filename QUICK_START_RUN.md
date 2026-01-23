# 🚀 Quick Start - Running the Application

## Problem
If you see this error:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

This means you're trying to run `npm run dev` from the root directory, but the `package.json` files are in the `frontend` and `backend` directories.

## ✅ Solution

### Option 1: Use the Root Script (Recommended)

I've created a root-level `package.json` that can run both servers. First install dependencies:

```powershell
# Install root dependencies (includes concurrently)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

Then run both servers:
```powershell
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

### Option 2: Use the PowerShell Script

Run the automated script:
```powershell
.\start-dev.ps1
```

This script will:
- Check and install all dependencies
- Start both frontend and backend servers
- Display the URLs where they're running

### Option 3: Run Servers Separately

**Terminal 1 - Frontend:**
```powershell
cd frontend
npm install  # Only needed first time
npm run dev
```

**Terminal 2 - Backend:**
```powershell
cd backend
npm install  # Only needed first time
npm run dev
```

## 📋 Available Scripts

### Root Level (from project root):
- `npm run dev` - Start both frontend and backend
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run install:all` - Install all dependencies
- `npm run build` - Build both frontend and backend

### Frontend (from `frontend/` directory):
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend (from `backend/` directory):
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm start` - Start production server

## 🔧 Troubleshooting

### "concurrently is not installed"
```powershell
npm install concurrently --save-dev
```

### "Dependencies not found"
Make sure you've installed dependencies in each directory:
```powershell
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### "Port already in use"
If port 3000 or 5173 is already in use:
- **Frontend**: Change port in `frontend/vite.config.ts`
- **Backend**: Change port in `backend/src/index.ts` or use environment variable

## 📚 Next Steps

1. Make sure your Supabase database is running
2. Check that environment variables are set (`.env` files)
3. Run migrations if needed
4. Start the servers using one of the methods above

For more details, see:
- `SETUP.md` - Full setup instructions
- `README.md` - Project overview
