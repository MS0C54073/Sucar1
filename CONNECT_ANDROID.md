# Connect Android app to backend

If the app shows **"Cannot connect to server"** or **Network Error**, follow these steps.

## 1. Start the backend first

The Android emulator talks to your PC at `http://10.0.2.2:5000`. The backend must be running on your machine.

**Option A – Use the script (recommended)**  
In the project root (where you see `backend` and `mobile` folders):

```powershell
.\start-backend-for-mobile.ps1
```

Wait until you see **"Backend is now running!"** or **"Backend is already running!"**.

**Option B – Start manually**

```powershell
cd backend
npm run dev
```

Wait until you see:

- `Supabase connected successfully` (or your DB ready)
- `SuCAR API Server`
- `Host: 0.0.0.0`
- `Port: 5000`

Leave this terminal open while using the app.

## 2. Allow HTTP in the Android app (already done)

The project has **`usesCleartextTraffic: true`** in `mobile/app.json` so the emulator can use `http://10.0.2.2:5000`.

If you changed this recently, rebuild the app so the new setting is applied:

```powershell
cd mobile
npx expo start -c
# Then press 'a' for Android, or run on device/emulator again
```

## 3. Check from the emulator

- Backend health:  
  In the **emulator’s browser** open: `http://10.0.2.2:5000/api/health`  
  You should see JSON with `"success": true`.
- On your PC browser:  
  `http://localhost:5000/api/health`  
  should show the same.

## 4. If it still fails

- **Backend not running**  
  Run step 1 again and wait for the “Server” and “Port: 5000” lines.

- **Port 5000 in use**  
  Stop the other program using 5000, or set `PORT=5001` in `backend/.env` and in the mobile app use `http://10.0.2.2:5001/api` (see `mobile/src/utils/api.ts`).

- **Firewall**  
  Windows Firewall might block Node. Allow `node.exe` for private networks, or temporarily disable the firewall to test.

- **Emulator/device**  
  Make sure the emulator has internet (e.g. open a website in the emulator browser). For a **physical device**, use your PC’s LAN IP instead of `10.0.2.2`, e.g. `http://192.168.1.100:5000/api` (and ensure phone and PC are on the same Wi‑Fi).

## Summary

1. Run `.\start-backend-for-mobile.ps1` (or `cd backend` then `npm run dev`).
2. Wait until the backend logs show it’s listening on port 5000.
3. Rebuild/restart the app if you just enabled `usesCleartextTraffic`.
4. Test `http://10.0.2.2:5000/api/health` in the emulator browser.

After this, login in the app should be able to reach the backend.
