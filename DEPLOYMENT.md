# SuCAR — Production Deployment Runbook

End‑to‑end steps to take SuCAR from this repo to a live product. Ordered by the
phased plan; each phase has an exit criterion. Commands assume the repo root.

> Architecture recap (A1): one backend (Express/TS), one DB (Supabase/Postgres),
> four roles (client, driver, operator, admin). The **web app** (landing + admin
> + operator + client) is one Vite build. The **mobile app** is one Expo codebase
> built into two variants — **client** (`com.sucar.client`) and **driver**
> (`com.sucar.driver`).

---

## 0. Prerequisites
- Node 20+, npm; Docker (for containerized web/backend); Expo account + EAS CLI
  (`npm i -g eas-cli`); a Supabase project; a domain.
- Accounts: Apple Developer ($99/yr), Google Play ($25 one‑time), Mapbox,
  an SMS/OTP provider (Twilio or a Zambian aggregator), Sentry (optional).

---

## 1. Security closeout  ✅ (code complete)
Already in the codebase:
- Default admin + seed users are **gated off in production** unless
  `ALLOW_DEFAULT_ADMIN=true` / `ALLOW_SEED_USERS=true`.
- JWT secret is **fail‑fast** in production; auth routes are rate‑limited;
  profile updates are allow‑listed; routes are role‑gated with ownership checks.

**You must still:**
- [ ] **Rotate every secret that ever lived in git history** (Supabase
  service‑role + anon keys, any old `JWT_SECRET`). History was not rewritten.
- [ ] Generate a strong `JWT_SECRET` (≥ 32 random chars).
- [ ] Confirm `backend/login.json` (if present) holds no live token.

**Exit:** new keys in the prod secret store; no default/seed accounts in prod.

---

## 2. Configure environment
Create the real env files from the examples (never commit them).

### `backend/.env`
```
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong-random>            # ≥16 chars (use 32+)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<rotated-anon>
SUPABASE_SERVICE_ROLE_KEY=<rotated-service-role>
DATABASE_URL=postgresql://...         # prod Postgres (for migrations)
MAPBOX_TOKEN=pk....                   # public token, URL-restricted in Mapbox
FRONTEND_URL=https://app.sucar.example
CORS_ORIGINS=https://admin.sucar.example
# OTP provider (phone-OTP-only mobile auth) — REQUIRED for mobile login:
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
# Seeding stays OFF in prod (do not set the ALLOW_* flags).
```

### `frontend/.env`
```
VITE_API_URL=https://api.sucar.example/api
# VITE_GOOGLE_CLIENT_ID=...   # only if web Google sign-in is enabled
```

### `mobile/.env` (build-time via EAS)
```
# Token is fetched from the backend by default; set only to pin a build:
# EXPO_PUBLIC_MAPBOX_TOKEN=pk....
# EXPO_PUBLIC_API_URL=https://api.sucar.example
```

**Exit:** all three environments populated from the rotated secrets.

---

## 3. Production data layer
1. Provision the prod Supabase project.
2. Apply migrations with a **controlled** step (not the app's auto-apply):
   ```
   cd backend && npm run migrate:all
   ```
   Confirm the new tables exist: `favorites`, `phone_verification_codes`,
   `reviews`, operator queue/bays/sessions, payment proof.
3. **Enable RLS** on every table the frontend reads with the anon key
   (the backend uses the service-role key server-side and bypasses RLS).
4. Turn on automated backups; run one restore test.

**Exit:** prod DB migrated, RLS verified, backup/restore proven.

---

## 4. Backend + Web deploy + CI/CD
- Containers exist (`backend/Dockerfile`, `frontend/Dockerfile`, `nginx.conf`,
  `docker-compose.yml`). Deploy to your host (Render/Fly/VPS).
- CI (`.github/workflows/ci.yml`) gates every PR on: backend typecheck+build+**tests**,
  frontend build, and **mobile typecheck**. Extend it to deploy `develop`→staging
  and tags→prod.
- Point the web app at `VITE_API_URL`; serve over HTTPS on your domain.
- Add **Sentry** (or equivalent) error + uptime monitoring.

Local sanity before deploy:
```
cd backend && npm run build && npm test
cd ../frontend && npm run build
cd ../mobile && npx tsc --noEmit
```

**Exit:** staging reachable; CI green; monitoring reporting.

---

## 5. Mobile release (EAS → stores)
Profiles are defined in `mobile/eas.json` (client + driver variants).
```
eas login
eas build:configure

# Internal test builds
eas build -p android --profile preview            # client
eas build -p android --profile preview-driver     # driver

# Production
eas build -p android --profile production
eas build -p android --profile production-driver
eas build -p ios --profile production
eas build -p ios --profile production-driver
```
Before production builds:
- [ ] Register bundle IDs `com.sucar.client` / `com.sucar.driver` (Apple + Play).
- [ ] Create real **Google OAuth** clients (web + Android SHA‑1 + iOS) if Google
  sign-in is ever re-enabled (mobile is phone-OTP-only today).
- [ ] Set the **Mapbox** token and confirm maps + geocoding populate booking
  coordinates (drives the live map, tracking, and the driver "Navigate" button).
- [ ] Configure the **OTP provider** (Twilio) — phone-OTP is the only mobile
  login, so SMS must work in prod.
- [ ] App icons, splash, screenshots, and a published **Privacy Policy + Terms**
  URL (store + OAuth-consent requirement).

Submit: `eas submit -p android --profile production` (and the driver/iOS equivalents) → 4 listings total.

**Exit:** signed builds submitted to TestFlight / Play internal testing, then review.

---

## 6. Testing & QA
- CI runs the unit suite (auth/roles/profile/JWT regressions).
- Add API integration tests for the booking → payment → review lifecycle.
- Full **4‑role manual QA** on staging (client, driver, operator, admin) on real
  iOS + Android devices.

**Exit:** suite green; QA checklist signed; no P0/P1 open.

---

## 7. Launch
1. Cut over apps/web to prod; smoke-test all four roles.
2. Watch monitoring for 48h; keep a hotfix lane and a documented rollback.
3. Operator onboarding via the admin `PendingApprovals` flow; support channel live.

---

## Go‑live checklist (quick)
- [ ] Secrets rotated; `JWT_SECRET` strong; no default/seed accounts in prod
- [ ] Prod Supabase migrated + RLS + backups
- [ ] Backend + web deployed over HTTPS; CORS locked to prod origins
- [ ] CI green; Sentry/monitoring live
- [ ] Mapbox token set; OTP/Twilio configured; payments decision implemented
- [ ] EAS production builds signed + submitted (client + driver, iOS + Android)
- [ ] Privacy Policy + Terms published; OAuth consent verified (if used)
- [ ] 4‑role staging QA signed off
