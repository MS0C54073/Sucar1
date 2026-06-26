# Mapbox Integration Setup Instructions

## Quick Start

### 1. Create Environment File

Create a file named `.env` in the `frontend` directory with the following content:

```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoibXV6b3NhbGkiLCJhIjoiY21oc2J2d2tyMGg3ejJtc2N4dXg0NGo4eiJ9.p75SiHMh2nWAlbnFR8kyXQ
VITE_API_URL=http://localhost:5000/api
```

### 2. Verify .gitignore

Ensure `.env` is in your `.gitignore` file to prevent committing the token:

```
# Environment variables
.env
.env.local
.env.production
```

### 3. Restart Development Server

After creating the `.env` file, restart your frontend development server:

```bash
cd frontend
npm run dev
```

## Verification

### Check Mapbox Token
1. Open browser console (F12)
2. Look for any Mapbox-related errors
3. Verify map loads correctly

### Test Map Features
1. **Client Dashboard**: Navigate to "Map View" tab
2. **Driver Dashboard**: Click "Map" view mode
3. **Car Wash Dashboard**: Click "Show Map" button
4. **Admin Dashboard**: Navigate to "Map View" menu

## Troubleshooting

### Map Not Loading
- **Error**: "Invalid Mapbox token"
  - **Solution**: Verify `VITE_MAPBOX_TOKEN` is set correctly in `.env`
  - **Check**: Token should start with `pk.eyJ`

### Location Not Working
- **Error**: "Could not get your location"
  - **Solution**: Grant browser location permissions
  - **Note**: Some browsers require HTTPS for geolocation

### Environment Variable Not Loading
- **Issue**: Token not found even though `.env` exists
  - **Solution**: 
    1. Ensure file is named exactly `.env` (not `.env.txt`)
    2. Restart the development server
    3. Clear browser cache and reload

## Security Best Practices

1. **Never commit `.env` to version control**
2. **Use different tokens for development and production**
3. **Restrict token scopes in Mapbox dashboard**
4. **Rotate tokens periodically**
5. **Use environment-specific configuration**

## Production Deployment

For production, set environment variables in your hosting platform:

- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables
- **Docker**: Use `-e` flag or `.env` file
- **Kubernetes**: Use ConfigMaps or Secrets

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend API is running
3. Check Mapbox account for token validity
4. Review `MAPBOX_INTEGRATION_COMPLETE.md` for detailed documentation
