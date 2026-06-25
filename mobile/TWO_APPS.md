# SuCAR — Two mobile apps (Client & Driver)

One codebase builds **two separate installable apps**:

| App | Package ID | Command |
|-----|------------|---------|
| **SuCAR** (clients) | `com.sucar.client` | `npm run android:client` |
| **SuCAR Driver** | `com.sucar.driver` | `npm run android:driver` |

Both can be installed on the same phone at the same time.

## Run on Android

**Terminal 1 — backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 — client app:**
```powershell
cd mobile
npm install
npm run android:client
```

The script starts the emulator if needed and adds Android SDK tools to PATH.

**If it still fails:** open Android Studio → **Device Manager** → ▶ start **Medium_Phone_API_36.1**, then run `npm run android:client` again.

**Without auto-launch** (press `a` when Metro is running):
```powershell
npm run start:client
```

**Terminal 3 — driver app (optional):**
```powershell
cd mobile
npm run android:driver
```

## Test accounts

| App | Email | Password |
|-----|-------|----------|
| Client | john.mwansa@email.com | client123 |
| Driver | james.mulenga@driver.com | driver123 |

Using a client account in the Driver app (or vice versa) shows a clear **Wrong app** screen.

## Web

The web app at `frontend/` still supports admin, car wash, client, and driver in one app. Only **mobile** is split into two apps.
