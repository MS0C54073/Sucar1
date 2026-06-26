# Fix Profile Picture Upload for All Users

## Issue
- Error: "Could not find the 'car_wash_picture_url' column of 'users' in the schema cache"
- Profile picture upload should work for all user roles (client, driver, carwash, admin)

## Solution

### 1. Run Database Migration
Run the migration script to add the `car_wash_picture_url` column:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS car_wash_picture_url TEXT;
```

Or use the migration file: `backend/migrations/add-car-wash-picture-now.sql`

### 2. Backend Changes
- Updated `updateProfile` controller to filter role-specific fields
- Updated `updateUser` in DBService to check if columns exist before updating
- Only sends `carWashPictureUrl` if user is a carwash

### 3. Frontend Changes
- Updated `handleSubmit` to only include `carWashPictureUrl` for carwash users
- Profile picture upload works for all roles (already implemented)

## Profile Picture Upload by Role

### All Roles (Client, Driver, Carwash, Admin)
- Can upload profile picture via the Profile page
- Profile picture is stored in `profile_picture_url` column
- Works the same for all roles

### Car Wash Role Only
- Can upload business picture in addition to profile picture
- Business picture is stored in `car_wash_picture_url` column
- Only shown in Business Details section

## Testing

1. **Client Profile Picture:**
   - Login as client
   - Go to Profile → Edit Profile
   - Upload profile picture
   - Should save successfully

2. **Driver Profile Picture:**
   - Login as driver
   - Go to Profile → Edit Profile
   - Upload profile picture
   - Should save successfully

3. **Car Wash Profile & Business Picture:**
   - Login as carwash
   - Go to Profile → Edit Profile
   - Upload profile picture (works)
   - Upload car wash business picture in Business Details section
   - Both should save successfully

4. **Admin Profile Picture:**
   - Login as admin
   - Go to Profile → Edit Profile
   - Upload profile picture
   - Should save successfully

## Migration Status
- ✅ Migration script created: `backend/migrations/add-car-wash-picture-now.sql`
- ⚠️ **IMPORTANT:** Run the migration in Supabase SQL Editor before using car wash picture feature
