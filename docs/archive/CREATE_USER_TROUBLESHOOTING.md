# Create User - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Column approval_status does not exist"

**Error**: `column users.approval_status does not exist`

**Solution**: 
1. Run the database migration in Supabase SQL Editor:
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste contents of `backend/migrations/add-user-approval-fields.sql`
   - Click Run

2. **OR** The code now handles this gracefully - it will create users without approval workflow if columns don't exist.

### Issue 2: "Failed to create user" (Generic Error)

**Possible Causes**:
1. **Duplicate Email**: Email already exists in database
   - **Solution**: Use a different email address

2. **Duplicate NRC**: NRC number already exists
   - **Solution**: Use a different NRC number

3. **Missing Required Fields**: 
   - Driver: License Number, Type, Expiry, Address
   - Car Wash: Name, Location, Washing Bays
   - **Solution**: Fill in all required fields

4. **Invalid Data Format**:
   - Email format invalid
   - Password too short (< 6 characters)
   - **Solution**: Check all field formats

### Issue 3: "Only administrators can create users"

**Error**: 403 Forbidden

**Solution**: 
- Make sure you're logged in as an Admin user
- Check your user role in the database
- Only users with `role = 'admin'` can create users

### Issue 4: Backend Server Not Running

**Error**: Network error, connection refused

**Solution**:
```bash
cd backend
npm run dev
```

### Issue 5: Database Connection Issues

**Error**: Cannot connect to database

**Solution**:
1. Check `.env` file in backend directory
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
3. Check Supabase project is active

## Testing Steps

### Step 1: Check Backend is Running
```bash
cd backend
npm run dev
```
Should see: "Server running on port 5000"

### Step 2: Check Database Connection
- Verify Supabase credentials in `.env`
- Test connection in Supabase dashboard

### Step 3: Test User Creation
1. Login as Admin
2. Go to Users → Add User
3. Fill in all required fields
4. Check browser console for errors (F12)
5. Check backend terminal for errors

### Step 4: Check Error Messages
- Frontend: Check error message in modal
- Backend: Check terminal output
- Network: Check Network tab in browser DevTools

## Debug Checklist

- [ ] Backend server is running
- [ ] Database connection is working
- [ ] User is logged in as Admin
- [ ] All required fields are filled
- [ ] Email format is valid
- [ ] Password is 6+ characters
- [ ] Email/NRC are not duplicates
- [ ] Role-specific fields are filled (if driver/carwash)
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows API request/response

## Quick Fixes

### If approval_status column doesn't exist:
The code will now work without it, but for full functionality, run:
```sql
-- In Supabase SQL Editor
-- Run: backend/migrations/add-user-approval-fields.sql
```

### If getting validation errors:
- Check all required fields are filled
- Verify email format (user@example.com)
- Verify password length (6+ characters)
- Check role-specific requirements

### If getting duplicate errors:
- Email must be unique
- NRC must be unique
- Check existing users in database

## Still Not Working?

1. **Check Browser Console** (F12 → Console tab)
   - Look for JavaScript errors
   - Look for API errors

2. **Check Network Tab** (F12 → Network tab)
   - Find the `/admin/users/create` request
   - Check request payload
   - Check response status and message

3. **Check Backend Logs**
   - Look at terminal where backend is running
   - Check for error messages
   - Check for validation errors

4. **Test API Directly**
   ```bash
   # Using curl or Postman
   POST http://localhost:5000/api/admin/users/create
   Headers: Authorization: Bearer <your-token>
   Body: { "name": "Test User", "email": "test@test.com", ... }
   ```

## Contact Support

If issue persists after trying all above:
1. Check browser console errors
2. Check backend terminal errors
3. Check network request/response
4. Verify database schema matches expected structure
