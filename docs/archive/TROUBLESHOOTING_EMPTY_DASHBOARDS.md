# Troubleshooting Empty Dashboards

## Issue
All user accounts (including admin) show empty dashboards with no data.

## Diagnostic Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- API errors (❌ API Error)
- Fetch logs (📡 Fetching...)
- Success logs (✅ Received...)
- Any red error messages

### 2. Check Network Tab
In DevTools → Network tab:
- Look for failed requests (red status codes)
- Check if `/api/bookings`, `/api/vehicles`, `/api/admin/dashboard` are returning data
- Verify response status codes (should be 200)
- Check response payloads

### 3. Verify Authentication
- Check if token is in localStorage: `localStorage.getItem('token')`
- Check if user is set: `localStorage.getItem('user')`
- Verify token is being sent in Authorization header

### 4. Check Backend Logs
Look at backend terminal for:
- API request logs
- Database query errors
- Authentication errors

### 5. Common Issues

#### Issue: API Returns Empty Arrays
**Symptom**: Console shows "✅ Received 0 bookings"
**Cause**: No data in database or incorrect filters
**Fix**: 
- Check database has bookings/vehicles
- Verify user IDs match in database
- Check role-based filtering logic

#### Issue: API Returns 401 Unauthorized
**Symptom**: Console shows "❌ API Error: 401"
**Cause**: Invalid or expired token
**Fix**:
- Logout and login again
- Check JWT_SECRET in backend .env
- Verify token format

#### Issue: API Returns 500 Server Error
**Symptom**: Console shows "❌ API Error: 500"
**Cause**: Backend error (database, service error)
**Fix**:
- Check backend logs for specific error
- Verify database connection
- Check Supabase credentials

#### Issue: Queries Not Running
**Symptom**: No console logs at all
**Cause**: User not set or query disabled
**Fix**:
- Verify user is logged in
- Check `enabled` prop in useQuery
- Verify user object structure

## Quick Fixes

### Clear Cache and Reload
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Check API Endpoint
```javascript
// In browser console:
fetch('http://localhost:5000/api/bookings', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Verify User Object
```javascript
// In browser console:
console.log('User:', JSON.parse(localStorage.getItem('user') || 'null'));
console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
```

## Expected Console Output

When working correctly, you should see:
```
🔍 ClientHome Debug: { user: { id: "...", name: "...", role: "client" }, hasToken: true }
📡 Fetching bookings from /bookings for user ... (client)
✅ Received 5 bookings
📡 Fetching vehicles for client
✅ Received 2 vehicles
```

## Backend Verification

Test backend endpoints directly:
```bash
# Get bookings (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/bookings

# Get vehicles
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/vehicles

# Admin dashboard
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/admin/dashboard
```

## Next Steps

1. **Check console logs** - Look for error messages
2. **Check network tab** - Verify API calls are being made
3. **Check backend logs** - Look for server errors
4. **Verify database** - Ensure data exists in Supabase
5. **Test API directly** - Use curl or Postman to test endpoints

If issues persist, share:
- Browser console errors
- Network tab screenshots
- Backend terminal logs
- Response from API test calls
