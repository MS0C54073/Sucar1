# SuCAR

SuCAR is a cross-platform car-wash booking platform for clients, drivers, car-wash operators, and administrators. The primary production path is a TypeScript/Express API backed by Supabase PostgreSQL and a React/Vite web client. An Expo mobile client is also maintained for client and driver workflows.

## Features

- Client registration, vehicles, service booking, payments, queue status, chat, notifications, and reviews
- Driver assignment, pickup/delivery status, earnings, and location tracking
- Operator service, booking, queue, and washing-bay management
- Admin user, booking, payment, reporting, compliance, and configuration tools
- JWT authentication with server-side role checks

## Architecture

| Component | Location | Stack |
| --- | --- | --- |
| API | `backend/` | Node.js, Express, TypeScript, Supabase client |
| Web app | `frontend/` | React, TypeScript, Vite |
| Mobile app | `mobile/` | Expo, React Native, TypeScript |
| Database | `supabase/migrations/` | PostgreSQL/Supabase |
| Shared types | `shared-types/` | TypeScript |

`dashboard-nextjs/` and `mobile-flutter/` are additional legacy client implementations. They are not required by the primary API/web/mobile workflow and should be treated as separate migration or retirement candidates.

## Prerequisites

- Node.js 20 LTS recommended
- npm
- A Supabase project, or Docker and the Supabase CLI for local development

## Configuration

Copy `backend/.env.example` to `backend/.env` and set the required values:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=use-a-random-secret-at-least-16-characters
JWT_EXPIRE=7d
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:5173
```

Optional integrations include Mapbox, Google OAuth, and Twilio. Keep service-role keys, JWT secrets, database credentials, and provider credentials outside source control. Production must not enable `ALLOW_DEFAULT_ADMIN`, `ALLOW_SEED_USERS`, or `RUN_STARTUP_DB_SETUP`.

For the web client, set `frontend/.env` as needed:

```env
VITE_API_URL=http://localhost:5000/api
```

## Database Setup

Use the versioned migrations as the source of truth:

```bash
supabase db push
```

The backend also contains legacy migration helpers for local recovery and historical environments. Do not run schema creation automatically in production. Run migrations and any seed scripts as explicit deployment steps.

## Development

Install dependencies with `npm install` in the root, `backend/`, `frontend/`, and `mobile/` directories. Run the API and web client from the repository root:

```bash
npm run dev
```

The API is available at `http://localhost:5000`; Vite prints the web URL when it starts. For Android/iOS development, run `npm start` in `mobile/` and configure the API URL for the device or emulator.

## Validation

```bash
cd backend && npm run build && npm test
cd ../frontend && npm run typecheck && npm run lint && npm run build
cd ../mobile && npx tsc --noEmit
```

CI runs the backend build/tests, frontend typecheck/build, and mobile typecheck. Frontend type errors are blocking CI failures.

## Production Deployment

1. Provision Supabase and apply `supabase/migrations` through the Supabase CLI or managed deployment pipeline.
2. Provision secrets through the hosting provider, including a strong `JWT_SECRET` and the Supabase service-role key.
3. Build the backend with `npm run build` in `backend/` and run `npm start`.
4. Build the web client with `npm run build` in `frontend/` and serve `dist/`.
5. Configure `FRONTEND_URL`/`CORS_ORIGINS`, health checks against `/api/health`, TLS, backups, and log/alert collection.
6. Provision the first administrator through a controlled operational workflow, never through public registration.

The API waits for database readiness before listening in production. Startup schema creation and fixture seeding are opt-in through `RUN_STARTUP_DB_SETUP=true` and are intended only for local development.

## Troubleshooting

- **Database connection fails:** verify Supabase is reachable, keys are correct, and local Supabase/Docker is running.
- **CORS errors:** add the exact browser origin to `FRONTEND_URL` or `CORS_ORIGINS`.
- **Authentication fails:** verify `JWT_SECRET`, database user state, and that the account is active.
- **Mobile cannot reach the API:** use the host machine LAN address for a physical device; Android emulators commonly use `10.0.2.2`.
- **Schema mismatch:** apply the versioned Supabase migrations before starting the API.

## Operational Notes

- Backend authorization and ownership checks are the security boundary; frontend role checks are presentation only.
- Location writes are restricted to authenticated drivers and location reads perform ownership checks.
- The backend currently uses a privileged Supabase server client, so route authorization must remain comprehensive. Plan a staged RLS/service-role reduction before adding new data paths.
- Rotate credentials that have ever been exposed in logs, documentation, local archives, or source-control history.