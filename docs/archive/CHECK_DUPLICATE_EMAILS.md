# Check for Duplicate Emails

## Issue
Getting "A user with this email already exists" error when creating users.

## Possible Causes

1. **Email Actually Exists**: The email you're trying to use is already in the database
2. **Case Sensitivity**: Email check is case-insensitive, so "Test@Email.com" and "test@email.com" are considered the same
3. **Seed Data**: If seed data was run, those emails already exist

## Solution

### Option 1: Check Existing Users

Check what emails are already in the database:

**In Supabase SQL Editor:**
```sql
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY created_at DESC;
```

This will show you all existing users and their emails.

### Option 2: Use a Different Email

When creating a user, make sure to use a **unique email** that doesn't exist in the database.

### Option 3: Check Seed Data Emails

If you ran the seed data script, these emails already exist:

**Clients:**
- john.mwansa@email.com
- sarah.banda@email.com
- peter.phiri@email.com
- mary.tembo@email.com
- david.ngoma@email.com

**Car Washes:**
- sparkle@carwash.com
- crystal@carwash.com
- shine@carwash.com
- premium@carwash.com
- quick@carwash.com
- elite@carwash.com
- autoshine@carwash.com
- mega@carwash.com
- spotless@carwash.com
- ultra@carwash.com

**Drivers:**
- james.mulenga@driver.com
- michael.chanda@driver.com
- robert.mwanza@driver.com
- thomas.banda@driver.com
- andrew.phiri@driver.com
- daniel.tembo@driver.com
- mark.ngoma@driver.com
- paul.mwila@driver.com
- steven.lungu@driver.com
- brian.mbewe@driver.com

**Don't use these emails when creating new users!**

### Option 4: Delete Existing User (If Needed)

If you need to reuse an email, first delete the existing user:

**In Supabase SQL Editor:**
```sql
-- First, check if user exists
SELECT id, name, email FROM users WHERE email = 'your-email@example.com';

-- If found, delete (be careful!)
DELETE FROM users WHERE email = 'your-email@example.com';
```

## Improved Error Messages

The error message now shows:
- Which email already exists (if available)
- More helpful guidance

Example:
- Old: "A user with this email already exists"
- New: "This email is already registered: test@example.com. Please use a different email address."

## Testing

1. Try creating a user with a **completely new email** (e.g., `newuser123@test.com`)
2. If it works, the issue was duplicate email
3. If it still fails, check the backend logs for more details

## Quick Fix

Use a unique email format when testing:
- `test1@example.com`
- `test2@example.com`
- `admin-test@example.com`
- `user-${Date.now()}@example.com` (timestamp-based, always unique)
