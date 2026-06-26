# Setup Seed Data - Complete Guide

This guide will help you set up seed data (5 clients, 10 car washes, 10 drivers) with AI recommendations and nearby search functionality.

## Prerequisites

1. Backend server running
2. Supabase database connected (local or cloud)
3. Node.js installed

## Step 1: Run Database Migration

First, add the required fields for location and ratings:

### Option A: Using Supabase SQL Editor

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `backend/migrations/add-location-rating-fields.sql`
4. Run the query

### Option B: Using psql (Local Supabase)

```bash
# If using local Supabase
psql -h localhost -p 54322 -U postgres -d postgres -f backend/migrations/add-location-rating-fields.sql
```

### Option C: Direct SQL Execution

The migration adds:
- `location_coordinates` (JSONB) - For storing lat/lng coordinates
- `driver_rating` (DECIMAL) - Driver rating (0-5.0)
- `completed_jobs` (INTEGER) - Number of completed jobs
- Indexes for performance

## Step 2: Run Seed Data Script

```bash
cd backend
npm run seed
```

Or directly:
```bash
cd backend
node scripts/seed-data.js
```

## Step 3: Verify Data

Check your Supabase dashboard:
- **Users table**: Should have 25+ users (5 clients + 10 car washes + 10 drivers + existing users)
- **Vehicles table**: Should have 10+ vehicles (2 per client)
- **Services table**: Should have 50+ services (5 per car wash)

## Step 4: Test Login

Use any credentials from `SEED_DATA_CREDENTIALS.md` to login:

**Example Client:**
- Email: `john.mwansa@email.com`
- Password: `client123`

**Example Car Wash:**
- Email: `sparkle@carwash.com`
- Password: `carwash123`

**Example Driver:**
- Email: `james.mulenga@driver.com`
- Password: `driver123`

## Step 5: Test AI Recommendations

### Using API (with authentication token):

```bash
# Get recommended car washes
curl -X GET "http://localhost:5000/api/recommendations/carwashes?lat=-15.3875&lng=28.3228&serviceType=Full Basic Wash" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get recommended drivers
curl -X GET "http://localhost:5000/api/recommendations/drivers?lat=-15.3875&lng=28.3228" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get nearby car washes
curl -X GET "http://localhost:5000/api/recommendations/nearby/carwashes?lat=-15.3875&lng=28.3228&radius=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get nearby drivers
curl -X GET "http://localhost:5000/api/recommendations/nearby/drivers?lat=-15.3875&lng=28.3228&radius=15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### From Frontend:

The recommendation system will automatically work when:
1. Client logs in
2. Goes to booking page
3. System fetches recommended car washes and drivers based on their location

## Troubleshooting

### Error: Column "location_coordinates" does not exist

**Solution**: Run the migration first (Step 1)

### Error: Duplicate key violation

**Solution**: The user already exists. The script will skip existing users. To reset:
```sql
-- WARNING: This deletes all seed data users
DELETE FROM users WHERE email LIKE '%@email.com' OR email LIKE '%@carwash.com' OR email LIKE '%@driver.com';
```

### Error: Cannot connect to database

**Solution**: 
1. Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Ensure Supabase is running (if local)
3. Check network connectivity (if cloud)

### No recommendations showing

**Solution**:
1. Ensure location coordinates are set (check `users.location_coordinates` in database)
2. Verify drivers have `availability = true`
3. Check that car washes have `is_active = true`
4. Ensure services are created for car washes

## Data Overview

### Clients (5)
- Each has 2 vehicles
- Located in Lusaka area
- Can book services and view recommendations

### Car Washes (10)
- Each has 5 services (Full Basic Wash, Engine Wash, Exterior Wash, Interior Wash, Wax and Polishing)
- Prices vary slightly (±20%)
- Located in different areas of Lusaka
- 2-6 washing bays each

### Drivers (10)
- Ratings: 4.1 to 4.9
- Completed jobs: 70 to 220
- All set to available
- Located in Lusaka area

## AI Recommendation Algorithm

### Car Wash Scoring:
1. **Location (40%)**: Distance from user (closer = higher score)
2. **Service Availability (30%)**: Offers requested service
3. **Capacity (20%)**: Number of washing bays
4. **Performance (10%)**: Historical completion rate

### Driver Scoring:
1. **Location (30%)**: Distance from user
2. **Rating (40%)**: Driver rating (0-5.0)
3. **Experience (20%)**: Number of completed jobs
4. **Availability (10%)**: Currently available

## Next Steps

1. **Integrate with Frontend**: Add recommendation UI to booking flow
2. **Add More Data**: Run seed script multiple times (it handles duplicates)
3. **Customize**: Modify seed script to add more users or change data
4. **Test**: Create bookings to test the full flow

## Files Created

- `backend/scripts/seed-data.js` - Seed data script
- `backend/migrations/add-location-rating-fields.sql` - Database migration
- `backend/src/services/recommendationService.ts` - AI recommendation service
- `backend/src/controllers/recommendationController.ts` - API controller
- `backend/src/routes/recommendationRoutes.ts` - API routes
- `SEED_DATA_CREDENTIALS.md` - All login credentials

---

**Need Help?** Check the main README.md or open an issue.
