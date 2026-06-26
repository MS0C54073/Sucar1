# Car Wash Picture Feature

## Overview
Car wash operators can now upload a business picture that will be displayed to clients when browsing car washes.

## Implementation Details

### Database
- Added `car_wash_picture_url` column to the `users` table
- Migration script: `backend/migrations/add-car-wash-picture.sql`

### Backend
- The `updateUser` method in `DBService` automatically handles the `carWashPictureUrl` field
- The field is converted from camelCase to snake_case (`car_wash_picture_url`) automatically
- Car wash picture is returned when fetching car washes via `/carwash/list` endpoint

### Frontend

#### Profile Page
- Car wash users can upload a business picture in the Profile page
- The upload section appears in the "Business Details" section when editing
- Picture is displayed when not editing (if uploaded)
- Uses base64 encoding for image storage (same as profile pictures)

#### Car Wash Listings
- Car wash pictures are displayed in:
  - `EnhancedNearbyCarWashes` component (main map sidebar)
  - `NearbyCarWashes` component
  - `BookService` page
- Falls back to emoji icon (🧼) if no picture is uploaded
- Pictures are displayed in a rounded container with proper sizing

### User Interface
- Upload placeholder with camera icon when no picture exists
- Preview of uploaded picture with "Change Picture" button
- Responsive design that works on all screen sizes
- Dark theme support

## Usage

### For Car Wash Operators
1. Go to Profile page
2. Click "Edit Profile"
3. Scroll to "Business Details" section
4. Click "Upload Car Wash Picture" or "Change Picture"
5. Select an image file
6. Click "Save Changes"

### For Clients
- Car wash pictures automatically appear in:
  - Nearby car washes list
  - Car wash selection during booking
  - Map view car wash markers (if implemented)

## Technical Notes
- Images are stored as base64 data URLs (same as profile pictures)
- Consider implementing cloud storage (e.g., Supabase Storage) for production
- Maximum recommended image size: 2MB
- Supported formats: JPG, PNG, GIF, WebP

## Migration
Run the migration script in Supabase SQL Editor:
```sql
-- See backend/migrations/add-car-wash-picture.sql
```

## Future Enhancements
- [ ] Implement cloud storage for images
- [ ] Add image compression before upload
- [ ] Add image cropping/editing functionality
- [ ] Support multiple images per car wash
- [ ] Add image gallery view
