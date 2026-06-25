# SuCAR Mobile — Setup & Testing

The mobile app is **clients & drivers only** (operators/admins use the web apps).
It is built from one codebase as two apps via `APP_VARIANT`:

| Variant | Command | App id | Who |
|---|---|---|---|
| client | `npm run start:client` | `com.sucar.client` | clients |
| driver | `npm run start:driver` | `com.sucar.driver` | drivers |

## 1. Start the backend (required)

The app talks to the backend API on port **5000**.

```powershell
cd ../backend
npm install      # first time
npm run dev      # listens on 0.0.0.0:5000
```

Verify it is up: open `http://localhost:5000/api/health` → should return `{"success":true,...}`.

Seed test accounts are created/repaired automatically on backend start:

| Role | Email | Password |
|---|---|---|
| Client | `john.mwansa@email.com` | `client123` |
| Driver | `james.mulenga@driver.com` | `driver123` |

> Operator (`carwash`) and admin accounts exist too, but they are **rejected** by the
> mobile app by design — use the web apps for those roles.

## 2. Install mobile deps

```powershell
cd ../mobile
npm install      # first time
```

## 3. Point the app at your backend (this is what usually breaks login)

The app resolves the backend URL in this order:

1. **`API_URL` env override** (most reliable) — set it when starting Expo.
2. Auto-detected from the Expo dev server host (works for a **physical phone on the same Wi‑Fi** via Expo Go).
3. `http://10.0.2.2:5000/api` fallback (Android **emulator** only).

### Android emulator (Android Studio)
No config needed — `10.0.2.2` maps to your PC's `localhost`.
```powershell
npm run start:client    # then press "a"
```

### Physical phone (Expo Go)
Same Wi‑Fi as the PC. If auto-detection picks the wrong interface, set it explicitly:
```powershell
# Find your PC's LAN IP first:  ipconfig  → IPv4 Address (e.g. 192.168.1.50)
$env:API_URL = "http://192.168.1.50:5000"; npm run start:client
```
(`/api` is appended automatically.)

### iOS
- Physical iPhone + **Expo Go** (same Wi‑Fi) — use the `API_URL` override as above.
- iOS Simulator requires **macOS + Xcode** (cannot run on Windows).

## 4. Common login failures & fixes

| Symptom | Cause | Fix |
|---|---|---|
| "Cannot connect to server" on a **physical phone** | Windows Firewall blocks inbound port 5000 | Allow it: `New-NetFirewallRule -DisplayName "SuCAR API 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow` (admin PowerShell) |
| Works on emulator, not on phone | Phone using `10.0.2.2`/`localhost` | Set `API_URL` to your PC's LAN IP (step 3) |
| "Invalid email or password" | Backend reachable but wrong creds | Use the seed accounts above (case-insensitive email) |
| "This account is for clients/drivers…" | Logging into the wrong variant (e.g., a driver account in the client app) | Use the matching app variant, or a matching test account |
| Nothing loads at all | Backend not running | Start it (step 1); confirm `/api/health` |

## 5. Quick verification that the stack works

With the backend running:
```powershell
curl -Method POST http://localhost:5000/api/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"john.mwansa@email.com","password":"client123"}'
```
A `success: true` response confirms the backend + accounts are fine, so any remaining
mobile login problem is **connectivity/config** (step 3/4), not credentials.

## Notes
- Branding uses `assets/Sucarcar.jpeg` (shared app logo + splash).
- Maps screens use `react-native-maps`; if a map screen crashes in Expo Go, build a dev client (`npx expo run:android`) or use EAS.
