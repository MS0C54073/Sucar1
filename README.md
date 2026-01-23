# SuCAR - Car Wash Pickup Booking System

A comprehensive cross-platform car wash booking system that connects clients, drivers, car wash operators, and administrators.

## System Overview

SuCAR (SuKA) is a full-stack application designed to automate car wash bookings and pickups, reducing client waiting time and improving service efficiency.

## Features

### Client Features
- Register/Login
- Book car wash pickup
- Select preferred driver and car wash
- Track booking status in real-time
- Manage vehicles
- View booking history

### Driver Features
- Register/Login
- Accept/decline booking requests
- Update booking status (Picked Up → Delivered)
- View assigned bookings
- Track performance

### Car Wash Features
- Register/Login
- Manage services and pricing
- Update vehicle status (Waiting Bay → Washing Bay → Drying Bay → Done)
- View incoming bookings
- Monitor revenue

### Admin Features
- Dashboard with statistics
- Manage drivers
- Manage bookings
- Assign drivers to bookings
- View reports and analytics
- Payment tracking

## Technology Stack

### Backend
- **Node.js** with **Express**
- **TypeScript**
- **Supabase** (PostgreSQL) for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Mapbox** for location services
- **Twilio** for SMS/OTP (optional)
- **Google OAuth** for social login

### Frontend (Web Dashboard)
- **React** with **TypeScript**
- **Vite** for build tooling
- **React Router** for navigation
- **React Query** for data fetching
- **Recharts** for analytics

### Mobile App
- **React Native** with **Expo**
- **TypeScript**
- **React Navigation**
- **Axios** for API calls
- **AsyncStorage** for local storage

## Project Structure

```
Sucar/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── models/      # TypeScript models
│   │   ├── controllers/ # Route controllers
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   └── config/      # Database config
│   └── package.json
├── frontend/        # React web dashboard
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── context/     # Auth context
│   └── package.json
└── mobile/         # React Native app
    ├── src/
    │   ├── screens/     # Screen components
    │   └── context/     # Auth context
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Supabase (local via Docker or cloud instance)
- Docker Desktop (for local Supabase)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
SUPABASE_URL=http://localhost:54325
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Note**: For local development, start Supabase first:
```bash
# From project root
.\start-supabase.ps1
# Or manually: supabase start
```

4. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup (Web Dashboard)

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `src/context/AuthContext.tsx`:
```typescript
const API_URL = 'http://YOUR_IP_ADDRESS:5000/api'; // Use your computer's IP for emulator/device
```

4. Start Expo:
```bash
npm start
```

5. For iOS Simulator:
```bash
npm run ios
```

6. For Android Emulator:
```bash
npm run android
```

## Testing with Emulators

### iOS Simulator (macOS only)
1. Install Xcode from App Store
2. Open Xcode and install iOS Simulator
3. Run `npm run ios` in the mobile directory

### Android Emulator
1. Install Android Studio
2. Set up Android Virtual Device (AVD)
3. Start the emulator from Android Studio
4. Run `npm run android` in the mobile directory

### Web Testing
- Frontend dashboard: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Bookings
- `GET /api/bookings` - Get all bookings (filtered by role)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Drivers
- `GET /api/drivers/available` - Get available drivers
- `GET /api/drivers/bookings` - Get driver bookings
- `PUT /api/drivers/bookings/:id/accept` - Accept booking
- `PUT /api/drivers/bookings/:id/decline` - Decline booking

### Car Wash
- `GET /api/carwash/list` - Get all car washes
- `GET /api/carwash/services` - Get services
- `GET /api/carwash/bookings` - Get car wash bookings
- `GET /api/carwash/dashboard` - Get dashboard stats
- `POST /api/carwash/services` - Create service
- `PUT /api/carwash/services/:id` - Update service

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/assign-driver` - Assign driver
- `GET /api/admin/reports` - Get reports

### Vehicles
- `GET /api/vehicles` - Get user vehicles
- `POST /api/vehicles` - Add vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Payments
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/booking/:bookingId` - Get payment by booking

## User Roles

1. **Client**: Can book car washes, manage vehicles, track bookings
2. **Driver**: Can accept bookings, update pickup/delivery status
3. **Car Wash**: Can manage services, update wash status
4. **Admin**: Full system access, manage all entities

## Database Schema

- **Users**: Clients, Drivers, Car Washes, Admins
- **Vehicles**: Client vehicle information
- **Bookings**: Booking records with status tracking
- **Services**: Car wash services and pricing
- **Payments**: Payment records

## Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ VEHICLES : "owns"
    USERS ||--o{ BOOKINGS : "creates"
    USERS ||--o{ BOOKINGS : "assigned_to"
    USERS ||--o{ BOOKINGS : "washes_at"
    USERS ||--o{ SERVICES : "offers"
    BOOKINGS ||--|| VEHICLES : "for"
    BOOKINGS ||--|| SERVICES : "includes"
    BOOKINGS ||--|| PAYMENTS : "has"
    
    USERS {
        uuid id PK
        string name
        string email UK
        string password
        string phone
        string nrc UK
        enum role "client|driver|carwash|admin"
        boolean is_active
        string business_name
        boolean is_business
        string license_no
        string license_type
        date license_expiry
        text address
        string marital_status
        boolean availability
        string car_wash_name
        string location
        integer washing_bays
        timestamp created_at
        timestamp updated_at
    }
    
    VEHICLES {
        uuid id PK
        uuid client_id FK
        string make
        string model
        string plate_no
        string color
        timestamp created_at
        timestamp updated_at
    }
    
    SERVICES {
        uuid id PK
        uuid car_wash_id FK
        string name
        text description
        decimal price
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    BOOKINGS {
        uuid id PK
        uuid client_id FK
        uuid driver_id FK
        uuid car_wash_id FK
        uuid vehicle_id FK
        uuid service_id FK
        enum booking_type "pickup_delivery|drive_in"
        text pickup_location
        jsonb pickup_coordinates
        enum status "pending|accepted|declined|picked_up|at_wash|waiting_bay|washing_bay|drying_bay|wash_completed|delivered|completed|cancelled"
        decimal total_amount
        enum payment_status "pending|paid|failed|refunded"
        timestamp scheduled_pickup_time
        timestamp actual_pickup_time
        timestamp wash_start_time
        timestamp wash_complete_time
        timestamp delivery_time
        integer queue_position
        integer estimated_wait_time
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        decimal amount
        enum method "cash|card|mobile_money|bank_transfer"
        enum status "pending|completed|failed|refunded"
        string transaction_id
        timestamp payment_date
        timestamp created_at
        timestamp updated_at
    }
```

## UML Diagrams

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Dashboard<br/>React + TypeScript]
        MOBILE[Mobile App<br/>React Native/Flutter]
    end
    
    subgraph "API Gateway"
        API[REST API<br/>Express + TypeScript]
    end
    
    subgraph "Business Logic Layer"
        AUTH[Authentication Service]
        BOOKING[Booking Service]
        PAYMENT[Payment Service]
        LOCATION[Location Service]
        NOTIFICATION[Notification Service]
    end
    
    subgraph "Data Layer"
        DB[(Supabase PostgreSQL)]
        CACHE[(Redis Cache)]
    end
    
    subgraph "External Services"
        MAPBOX[Mapbox API]
        TWILIO[Twilio SMS]
        GOOGLE[Google OAuth]
    end
    
    WEB --> API
    MOBILE --> API
    API --> AUTH
    API --> BOOKING
    API --> PAYMENT
    API --> LOCATION
    API --> NOTIFICATION
    AUTH --> DB
    BOOKING --> DB
    PAYMENT --> DB
    LOCATION --> DB
    NOTIFICATION --> DB
    BOOKING --> CACHE
    LOCATION --> MAPBOX
    NOTIFICATION --> TWILIO
    AUTH --> GOOGLE
```

### Class Diagram - Backend Core Classes

```mermaid
classDiagram
    class DBService {
        +findUserByEmail(email: string): User
        +findUserById(id: string): User
        +createUser(userData: User): User
        +updateUser(id: string, data: User): User
        +comparePassword(plain: string, hashed: string): boolean
        +getBookings(filters: object): Booking[]
        +createBooking(bookingData: Booking): Booking
        +updateBooking(id: string, data: Booking): Booking
    }
    
    class AuthController {
        +register(req: Request, res: Response): void
        +login(req: Request, res: Response): void
        +getMe(req: Request, res: Response): void
        +updateProfile(req: Request, res: Response): void
        +googleLogin(req: Request, res: Response): void
        +sendOTP(req: Request, res: Response): void
        +verifyOTP(req: Request, res: Response): void
    }
    
    class BookingController {
        +getBookings(req: Request, res: Response): void
        +createBooking(req: Request, res: Response): void
        +getBookingById(req: Request, res: Response): void
        +updateBookingStatus(req: Request, res: Response): void
        +cancelBooking(req: Request, res: Response): void
    }
    
    class User {
        +id: UUID
        +name: string
        +email: string
        +password: string
        +phone: string
        +nrc: string
        +role: enum
        +isActive: boolean
    }
    
    class Booking {
        +id: UUID
        +clientId: UUID
        +driverId: UUID
        +carWashId: UUID
        +vehicleId: UUID
        +serviceId: UUID
        +status: enum
        +totalAmount: decimal
        +paymentStatus: enum
    }
    
    class Vehicle {
        +id: UUID
        +clientId: UUID
        +make: string
        +model: string
        +plateNo: string
        +color: string
    }
    
    class Service {
        +id: UUID
        +carWashId: UUID
        +name: string
        +description: string
        +price: decimal
        +isActive: boolean
    }
    
    AuthController --> DBService : uses
    BookingController --> DBService : uses
    DBService --> User : manages
    DBService --> Booking : manages
    DBService --> Vehicle : manages
    DBService --> Service : manages
    Booking --> User : references
    Booking --> Vehicle : references
    Booking --> Service : references
    Vehicle --> User : belongs to
    Service --> User : belongs to
```

### Sequence Diagram - User Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant AuthController
    participant DBService
    participant Supabase
    participant JWT
    
    User->>Frontend: Enter email & password
    Frontend->>API: POST /api/auth/login
    API->>AuthController: login(req, res)
    AuthController->>AuthController: Validate input
    AuthController->>DBService: findUserByEmail(email)
    DBService->>Supabase: SELECT * FROM users WHERE email = ?
    Supabase-->>DBService: User data
    DBService-->>AuthController: User object
    AuthController->>DBService: comparePassword(password, user.password)
    DBService->>Supabase: Verify password hash
    Supabase-->>DBService: Password match result
    DBService-->>AuthController: Password verified
    AuthController->>JWT: generateToken(user.id)
    JWT-->>AuthController: JWT token
    AuthController-->>API: { success: true, data: { user, token } }
    API-->>Frontend: HTTP 200 Response
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Frontend: Navigate to dashboard
    Frontend-->>User: Show dashboard
```

### Sequence Diagram - Booking Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant API
    participant BookingController
    participant DBService
    participant Supabase
    participant PaymentService
    
    Client->>Frontend: Select service & vehicle
    Frontend->>API: POST /api/bookings
    API->>BookingController: createBooking(req, res)
    BookingController->>BookingController: Validate request
    BookingController->>DBService: getServiceById(serviceId)
    DBService->>Supabase: SELECT * FROM services WHERE id = ?
    Supabase-->>DBService: Service data
    DBService-->>BookingController: Service object
    BookingController->>BookingController: Calculate total amount
    BookingController->>DBService: createBooking(bookingData)
    DBService->>Supabase: INSERT INTO bookings
    Supabase-->>DBService: New booking
    DBService-->>BookingController: Booking object
    BookingController->>PaymentService: createPayment(bookingId, amount)
    PaymentService->>DBService: createPayment(paymentData)
    DBService->>Supabase: INSERT INTO payments
    Supabase-->>DBService: Payment record
    DBService-->>PaymentService: Payment object
    PaymentService-->>BookingController: Payment created
    BookingController-->>API: { success: true, data: booking }
    API-->>Frontend: HTTP 201 Created
    Frontend->>Frontend: Update UI
    Frontend-->>Client: Show booking confirmation
```

### Use Case Diagram

```mermaid
graph LR
    subgraph "Client"
        UC1[Register/Login]
        UC2[Book Car Wash]
        UC3[Manage Vehicles]
        UC4[Track Booking]
        UC5[View History]
    end
    
    subgraph "Driver"
        UC6[Register/Login]
        UC7[Accept Booking]
        UC8[Update Status]
        UC9[View Assignments]
        UC10[Track Performance]
    end
    
    subgraph "Car Wash"
        UC11[Register/Login]
        UC12[Manage Services]
        UC13[Update Wash Status]
        UC14[View Bookings]
        UC15[Monitor Revenue]
    end
    
    subgraph "Admin"
        UC16[Login]
        UC17[Manage Users]
        UC18[Manage Bookings]
        UC19[Assign Drivers]
        UC20[View Reports]
        UC21[Payment Tracking]
    end
    
    Client --> UC1
    Client --> UC2
    Client --> UC3
    Client --> UC4
    Client --> UC5
    
    Driver --> UC6
    Driver --> UC7
    Driver --> UC8
    Driver --> UC9
    Driver --> UC10
    
    CarWash --> UC11
    CarWash --> UC12
    CarWash --> UC13
    CarWash --> UC14
    CarWash --> UC15
    
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    Admin --> UC20
    Admin --> UC21
```

### Component Diagram - Frontend Architecture

```mermaid
graph TB
    subgraph "Frontend Application"
        subgraph "Pages"
            LP[Login Page]
            RP[Register Page]
            CH[Client Home]
            DH[Driver Home]
            CW[Car Wash Dashboard]
            AD[Admin Dashboard]
        end
        
        subgraph "Components"
            BC[Booking Components]
            VC[Vehicle Components]
            MC[Map Components]
            NC[Notification Components]
        end
        
        subgraph "State Management"
            AC[Auth Context]
            RQ[React Query]
            LS[Local State]
        end
        
        subgraph "Services"
            API[API Client]
            MS[Mapping Service]
            NS[Notification Service]
        end
    end
    
    LP --> AC
    RP --> AC
    CH --> BC
    CH --> VC
    CH --> MC
    DH --> BC
    CW --> BC
    AD --> BC
    BC --> RQ
    VC --> RQ
    MC --> MS
    NC --> NS
    RQ --> API
    AC --> API
    API --> Backend[Backend API]
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation
- Protected API routes

## Future Enhancements

- GPS-based live vehicle tracking
- Push notifications
- Payment gateway integration
- Real-time updates with WebSockets
- AI-driven route optimization
- Business intelligence dashboards

## License

ISC

## Support

For issues and questions, please contact the development team.
