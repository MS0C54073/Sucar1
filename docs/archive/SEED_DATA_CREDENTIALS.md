# SuCAR Seed Data - Login Credentials

This file contains login credentials for all seeded users created by the seed data script.

**Login URL**: http://localhost:5173/login

**Note**: All passwords are simple for testing purposes. Change them in production!

---

## 📱 Clients (5)

### 1. John Mwansa
- **Email**: john.mwansa@email.com
- **Password**: client123
- **Role**: Client

### 2. Sarah Banda
- **Email**: sarah.banda@email.com
- **Password**: client123
- **Role**: Client

### 3. Peter Phiri
- **Email**: peter.phiri@email.com
- **Password**: client123
- **Role**: Client

### 4. Mary Tembo
- **Email**: mary.tembo@email.com
- **Password**: client123
- **Role**: Client

### 5. David Ngoma
- **Email**: david.ngoma@email.com
- **Password**: client123
- **Role**: Client

---

## 🧼 Car Washes (10)

### 1. Sparkle Auto Wash
- **Email**: sparkle@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Cairo Road, Lusaka
- **Washing Bays**: 3

### 2. Crystal Clean Car Wash
- **Email**: crystal@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Great East Road, Lusaka
- **Washing Bays**: 4

### 3. Shine Bright Car Care
- **Email**: shine@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Makeni Road, Lusaka
- **Washing Bays**: 2

### 4. Premium Wash Center
- **Email**: premium@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Woodlands, Lusaka
- **Washing Bays**: 5

### 5. Quick Wash Express
- **Email**: quick@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Kabulonga, Lusaka
- **Washing Bays**: 2

### 6. Elite Car Spa
- **Email**: elite@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Roma, Lusaka
- **Washing Bays**: 3

### 7. Auto Shine Pro
- **Email**: autoshine@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Northmead, Lusaka
- **Washing Bays**: 4

### 8. Mega Wash Hub
- **Email**: mega@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Chilenje, Lusaka
- **Washing Bays**: 6

### 9. Spotless Auto Care
- **Email**: spotless@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Libala, Lusaka
- **Washing Bays**: 3

### 10. Ultra Clean Services
- **Email**: ultra@carwash.com
- **Password**: carwash123
- **Role**: Car Wash
- **Location**: Chainda, Lusaka
- **Washing Bays**: 2

---

## 🚗 Drivers (10)

### 1. James Mulenga
- **Email**: james.mulenga@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.8/5.0
- **Completed Jobs**: 150

### 2. Michael Chanda
- **Email**: michael.chanda@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.5/5.0
- **Completed Jobs**: 120

### 3. Robert Mwanza
- **Email**: robert.mwanza@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.9/5.0
- **Completed Jobs**: 200

### 4. Thomas Banda
- **Email**: thomas.banda@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.2/5.0
- **Completed Jobs**: 80

### 5. Andrew Phiri
- **Email**: andrew.phiri@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.7/5.0
- **Completed Jobs**: 180

### 6. Daniel Tembo
- **Email**: daniel.tembo@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.6/5.0
- **Completed Jobs**: 140

### 7. Mark Ngoma
- **Email**: mark.ngoma@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.4/5.0
- **Completed Jobs**: 100

### 8. Paul Mwila
- **Email**: paul.mwila@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.3/5.0
- **Completed Jobs**: 90

### 9. Steven Lungu
- **Email**: steven.lungu@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.9/5.0
- **Completed Jobs**: 220

### 10. Brian Mbewe
- **Email**: brian.mbewe@driver.com
- **Password**: driver123
- **Role**: Driver
- **Rating**: 4.1/5.0
- **Completed Jobs**: 70

---

## 🔧 Setup Instructions

### 1. Run Database Migration

First, add the location and rating fields to the database:

```sql
-- Run this in Supabase SQL Editor
-- File: backend/migrations/add-location-rating-fields.sql
```

Or execute:
```bash
psql -h localhost -U postgres -d postgres -f backend/migrations/add-location-rating-fields.sql
```

### 2. Run Seed Data Script

```bash
cd backend
node scripts/seed-data.js
```

This will:
- Create 5 clients with vehicles
- Create 10 car washes with services
- Create 10 drivers with ratings
- Generate login credentials

### 3. Verify Data

Check the Supabase dashboard to verify all users were created successfully.

---

## 📍 AI Recommendation System

The system includes an AI-powered recommendation engine that suggests:

### Car Washes Based On:
- **Location** (40% weight) - Closer is better
- **Service Availability** (30% weight) - Offers requested service
- **Capacity** (20% weight) - More washing bays
- **Performance** (10% weight) - Completion rate

### Drivers Based On:
- **Location** (30% weight) - Closer is better
- **Rating** (40% weight) - Higher rating = better
- **Experience** (20% weight) - More completed jobs
- **Availability** (10% weight) - Currently available

### API Endpoints

#### Get Recommended Car Washes
```
GET /api/recommendations/carwashes?lat=-15.3875&lng=28.3228&serviceType=Full Basic Wash&maxDistance=10
```

#### Get Recommended Drivers
```
GET /api/recommendations/drivers?lat=-15.3875&lng=28.3228&maxDistance=15
```

#### Get Nearby Car Washes
```
GET /api/recommendations/nearby/carwashes?lat=-15.3875&lng=28.3228&radius=10
```

#### Get Nearby Drivers
```
GET /api/recommendations/nearby/drivers?lat=-15.3875&lng=28.3228&radius=15
```

---

## 🎯 Testing Recommendations

1. **Login as a client** using any client credentials above
2. **Go to booking page** and the system will show:
   - Recommended car washes based on your location
   - Recommended drivers based on ratings and proximity
   - Nearby options sorted by distance

3. **Test different locations** by changing lat/lng parameters

---

## 📝 Notes

- All users are created with `is_active: true`
- All drivers are set to `availability: true`
- Each client has 2 vehicles automatically created
- Each car wash has all 5 service types with varied pricing
- Driver ratings range from 4.1 to 4.9
- All locations are in Lusaka, Zambia area
- Coordinates are randomly generated within ~10km radius

---

**Generated by**: `backend/scripts/seed-data.js`
**Date**: Auto-generated on script execution
