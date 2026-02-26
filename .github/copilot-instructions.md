# SuCAR AI Agent Instructions

## System Architecture Overview

**SuCAR** is a multi-role car wash booking platform with role-based access control (Client, Driver, Car Wash, Admin). The system uses **Supabase PostgreSQL** for data persistence with **Row Level Security (RLS)** policies, an **Express.js TypeScript API**, and a **React** frontend.

### Core Data Flow
1. **Clients** book services (Pickup & Delivery vs Drive-In) via the React app
2. **Drivers** accept/manage pickups through API routes authenticated via JWT
3. **Car Washes** manage queue positions and service statuses via real-time components
4. **Admins** oversee all operations through comprehensive dashboards
5. All role-based access enforced via RLS policies in Supabase + backend middleware

### Key Constraint: Case-Insensitive Email Lookups
The backend explicitly handles case-insensitive email matching in `[src/services/db-service.ts](src/services/db-service.ts#L36)`. Always normalize emails to lowercase when querying users to avoid "user not found" errors despite existing accounts.

---

## Project Structure & Key Files

```
backend/src/
  ├── config/supabase.ts         # Supabase client initialization
  ├── middleware/auth.ts         # JWT protect & authorize middleware
  ├── services/db-service.ts     # All database operations (critical!)
  ├── controllers/               # Request handlers (bookingController, chatController, etc.)
  ├── routes/                    # API endpoints (11 route files including chat & queue)
  ├── migrations/                # Database initialization scripts
  └── models/                    # MongoDB models (legacy, being migrated to Supabase)

frontend/src/
  ├── components/booking/BookingCard.tsx    # Unified booking display (all roles)
  ├── components/chat/ChatWindow.tsx        # Real-time chat with polling
  ├── components/queue/                     # Queue display & management
  ├── components/driver/    cfc                 # Route optimizer, earnings
  ├── pages/                                # Role-specific dashboards
  ├── services/api.ts                       # Axios API client (handles auth headers)
  └── context/                              # Auth/user state context
```

---

## Critical Patterns & Conventions

### 1. Database Naming Convention
- **Snake_case** in Supabase tables (e.g., `booking_type`, `estimated_wait_time`)
- **CamelCase** in TypeScript/frontend code
- **Use conversion helpers** in `DBService`:
  - `toCamelCase()` - Supabase → JavaScript
  - `toSnakeCase()` - JavaScript → Supabase

```typescript
// Example from db-service.ts
const snakeObj = toSnakeCase({bookingType: 'pickup_delivery'});
// Result: {booking_type: 'pickup_delivery'}
```

### 2. Authentication & Role-Based Access
- **JWT tokens** stored in request headers (`Bearer <token>`)
- **Middleware**: `protect` middleware validates JWT; `authorize` checks roles
- **Database-enforced**: RLS policies on all sensitive tables (users, bookings, messages, payments)
- **Roles**: `client`, `driver`, `car_wash`, `admin`

```typescript
// Example route protection
router.post('/create', protect, authorize('client'), bookingController.createBooking);
```

### 3. Real-Time Components (Polling-Based, Not WebSockets)
- **Chat** (`ChatWindow.tsx`): Polls messages every 3 seconds
- **Queue** (`QueueDisplay.tsx`, `QueueManagement.tsx`): Polls queue updates every 3 seconds
- **Rationale**: Simpler deployment, no WebSocket infrastructure needed
- **Pattern**: Use React Query or custom intervals with `setInterval`

### 4. Booking Type System
Two distinct booking workflows:
- **Pickup & Delivery**: Driver handles full flow, car wash only processes wash, automatic queue management
- **Drive-In**: Client drives to location, joins visible queue, car wash manages queue progress
- **Database field**: `booking_type` enum (pickup_delivery | drive_in)
- **Conditional Logic**: Different UI flows and API calls based on booking type in [frontend/src/pages/BookService.tsx](frontend/src/pages/BookService.tsx)

### 5. Unified BookingCard Component
All dashboards (Client, Driver, Car Wash) use the same `[BookingCard.tsx](frontend/src/components/booking/BookingCard.tsx)` component with role-based rendering:
- **Props**: `booking`, `userRole`, `onStatusChange`
- **Features**: Integrated chat modal, queue display for drive-in, action buttons based on role/status
- **Benefits**: Single source of truth for booking display logic

### 6. Service Layer Pattern
All database operations centralized in `[DBService](backend/src/services/db-service.ts)` (static methods):
- `findUserByEmail()`, `findUserById()`, `createUser()`
- `createBooking()`, `updateBookingStatus()`, `getBookingsByUser()`
- `getQueueForCarWash()`, `addToQueue()`, `startService()`, `completeService()`
- **Benefit**: Consistent error handling, case-insensitive queries, RLS policy compliance

### 7. Frontend API Client Pattern
`[services/api.ts](frontend/src/services/api.ts)` provides a shared Axios instance that:
- Automatically includes JWT token from `localStorage` in headers
- Handles API base URL configuration
- Implements unified error handling
- Used by all API-calling components

```typescript
// Usage across frontend
const { data } = await api.get('/api/bookings/my-bookings');
```

---

## Common Development Tasks

### Adding a New API Endpoint
1. **Database Schema**: Ensure table exists in Supabase with RLS policies
2. **Service Method**: Add static method to `DBService` class in `backend/src/services/db-service.ts`
3. **Controller**: Create handler function in `backend/src/controllers/newController.ts`
4. **Route**: Add endpoint to `backend/src/routes/newRoutes.ts` with appropriate middleware
5. **Frontend**: Use `api.get()` or `api.post()` from centralized client

### Adding a Role-Based Dashboard Component
1. **Use BookingCard** as the base component for displaying bookings
2. **Integrate ChatWindow** for role-specific messaging
3. **Add real-time polling** if displaying live updates (see queue/chat patterns)
4. **Protect the page** with `AuthContext` checks in frontend
5. **Test role-based rendering** by checking `userRole` prop

### Running Migrations & Seeding Data
```bash
# Backend directory
npm run migrate:auto      # Auto-create tables
npm run seed              # Seed initial data
npm run create-admin      # Create admin user
```

---

## Common Pitfalls & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "User not found" despite account existing | Email case mismatch | Use `DBService.findUserByEmail()` which handles case-insensitive lookup |
| Chat/Queue not updating in real-time | Polling interval too long or not triggered | Check component uses `setInterval` with 3s interval; verify API endpoint returns updated data |
| Role-based UI not rendering correctly | Middleware not enforcing authorization | Verify `authorize('role')` middleware applied to route; check RLS policy on table |
| Frontend can't find booking | Query filter mismatch (snake vs camelCase) | Use `toCamelCase()` when converting Supabase response; verify field names in query |
| Booking type conditional logic not working | Missing checks in BookingCard or controller | Check `booking.booking_type` field is populated; verify both UI and backend handle both types |

---

## External Dependencies & Integration Points

- **Supabase**: All user/booking/queue/message data; RLS-enforced security
- **Express middleware**: `cors`, `express-validator` (input validation)
- **Frontend libs**: React Query (data fetching), Recharts (analytics charts), Mapbox GL (mapping)
- **JWT**: `jsonwebtoken` library for token generation/verification
- **Password hashing**: `bcryptjs` for secure password storage

---

## Useful Commands for AI Agents

```bash
# Backend development
cd backend
npm run dev                     # Start dev server (watches for changes)
npm run build                  # Compile TypeScript to JavaScript

# Database setup
npm run migrate:auto           # Create/update tables (run after schema changes)
npm run seed                   # Populate test data

# Frontend development
cd ../frontend
npm run dev                    # Start Vite dev server

# Testing/Debugging
npm run test                   # Run test suite (if configured)
npm run lint                   # Check code style
```

---

## Frontend API Patterns

All frontend requests should use the centralized `api` client:

```typescript
import { api } from '../services/api';

// GET with query params
const { data: bookings } = await api.get('/api/bookings/my-bookings');

// POST with data
await api.post('/api/bookings', { 
  serviceId: 1, 
  vehicleId: 2, 
  bookingType: 'drive_in' 
});

// PUT with status update
await api.put(`/api/bookings/${bookingId}`, { status: 'completed' });
```

The client automatically attaches JWT tokens and handles base URL routing.

---

## When Adding Features, Consider These Integration Points

1. **New booking statuses**? Update enum in backend models + RLS policy + frontend UI
2. **New user role**? Add role to `authorize()` middleware + RLS policy check + dashboard component
3. **New real-time data**? Add polling interval to component + service method for data fetching
4. **New payment method**? Implement in `[paymentRoutes.ts](backend/src/routes/paymentRoutes.ts)` + backend validation
5. **New analytics metric**? Add query to admin controller + chart component in dashboard

---

## Questions? Check These Reference Files

- **Architecture decisions**: [SYSTEM_COMPLETE_SUMMARY.md](SYSTEM_COMPLETE_SUMMARY.md), [COMPLETE_IMPLEMENTATION_GUIDE.md](COMPLETE_IMPLEMENTATION_GUIDE.md)
- **Tech stack details**: [TECH_STACK.md](TECH_STACK.md)
- **Setup/deployment**: [SETUP.md](SETUP.md), [LOCAL_SUPABASE_QUICK_START.md](LOCAL_SUPABASE_QUICK_START.md)
- **Troubleshooting**: [TROUBLESHOOTING_EMPTY_DASHBOARDS.md](TROUBLESHOOTING_EMPTY_DASHBOARDS.md)
