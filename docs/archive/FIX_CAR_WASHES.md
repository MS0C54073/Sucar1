# Fix Missing Car Washes

## Issue
You're only seeing 2 car washes instead of the expected 10. This is likely because:
1. The seed data script was run before the approval workflow migration
2. Existing car washes don't have `approval_status` set
3. The approval workflow might be filtering them out

## Solution

### Option 1: Fix Existing Data (Recommended)

Run the fix script to update all existing users with approval status:

```bash
cd backend
npm run fix-approvals
```

This will:
- Find all users without `approval_status`
- Set them to `approved` status
- Show you a summary of car washes

### Option 2: Re-run Seed Data

If you want to re-seed all data (this will create duplicates if users already exist):

```bash
cd backend
npm run seed
```

The updated seed script now includes `approval_status: 'approved'` for all seeded users.

### Option 3: Manual Database Update

If you prefer to update manually in Supabase SQL Editor:

```sql
-- Set all existing car washes to approved
UPDATE users 
SET 
  approval_status = 'approved',
  approved_at = NOW()
WHERE 
  role = 'carwash' 
  AND (approval_status IS NULL OR approval_status = '');
```

## Verify

After running the fix, check the car washes:

1. Go to Admin Dashboard → Car Washes
2. You should now see all 10 car washes:
   - Sparkle Auto Wash
   - Crystal Clean Car Wash
   - Shine Bright Car Care
   - Premium Wash Center
   - Quick Wash Express
   - Elite Car Spa
   - Auto Shine Pro
   - Mega Wash Hub
   - Spotless Auto Care
   - Ultra Clean Services

## Expected Car Washes

The seed data creates 10 car washes with these details:

1. **Sparkle Auto Wash** - Cairo Road, Lusaka (3 bays)
2. **Crystal Clean Car Wash** - Great East Road, Lusaka (4 bays)
3. **Shine Bright Car Care** - Makeni Road, Lusaka (2 bays)
4. **Premium Wash Center** - Woodlands, Lusaka (5 bays)
5. **Quick Wash Express** - Kabulonga, Lusaka (2 bays)
6. **Elite Car Spa** - Roma, Lusaka (3 bays)
7. **Auto Shine Pro** - Northmead, Lusaka (4 bays)
8. **Mega Wash Hub** - Chilenje, Lusaka (6 bays)
9. **Spotless Auto Care** - Libala, Lusaka (3 bays)
10. **Ultra Clean Services** - Chainda, Lusaka (2 bays)

All car washes have:
- Email: `[name]@carwash.com` (e.g., `sparkle@carwash.com`)
- Password: `carwash123`
- Location coordinates in Lusaka area
- 5 services each (Full Basic Wash, Engine Wash, Exterior Wash, Interior Wash, Wax and Polishing)
