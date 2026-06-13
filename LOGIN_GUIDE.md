# SuCAR Login Guide

## 1. Start the backend (required)

```powershell
cd backend
npm run dev
```

Wait for `SuCAR API Server` on port **5000**.

Optional — seed test users if logins fail:

```powershell
cd backend
npm run seed
```

Verify logins:

```powershell
npm run test:logins
```

## 2. Web app (all roles)

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173/login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sucar.com | admin123 |
| Client | john.mwansa@email.com | client123 |
| Driver | james.mulenga@driver.com | driver123 |
| Car wash | sparkle@carwash.com | carwash123 |

After login you are sent to `/admin`, `/client`, `/driver`, or `/carwash`.

## 3. Mobile apps

**Client app** (`npm run android:client`):

- john.mwansa@email.com / client123

**Driver app** (`npm run android:driver`):

- james.mulenga@driver.com / driver123

Backend must run on your PC. Android emulator uses `http://10.0.2.2:5000/api` automatically.

Physical device: set your PC LAN IP in `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
```

Then restart Expo with `npx expo start -c`.

## Troubleshooting

- **Invalid email or password** — run `cd backend && npm run seed`, restart backend.
- **Cannot connect** — backend not running or wrong API URL on mobile.
- **Wrong app** — use the Client app for client accounts and Driver app for driver accounts.
