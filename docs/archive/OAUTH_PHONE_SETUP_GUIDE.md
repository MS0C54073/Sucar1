# 🚀 Google OAuth & Phone Authentication - Setup Guide

## ✅ Implementation Complete!

Both Google OAuth and Phone Number authentication have been fully implemented for login and registration.

---

## 📋 Setup Steps

### 1. Run Database Migration

**Option A: Using Supabase Studio (Recommended)**
1. Open Supabase Studio: http://localhost:54326
2. Go to **SQL Editor**
3. Copy and paste the contents of `backend/scripts/migrate-oauth-phone.sql`
4. Click **Run**

**Option B: Using Script**
```bash
cd backend
node scripts/run-oauth-migration.js
```
(Note: This will provide instructions - Supabase doesn't support direct SQL execution via REST API)

### 2. Configure Environment Variables

#### Backend (`backend/.env`)

**Required for Google OAuth:**
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Optional for Phone SMS (Twilio):**
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```

**Note:** If Twilio is not configured, the system uses mock mode:
- Mock OTP code: `123456`
- Codes are stored in database for verification

#### Frontend (`frontend/.env`)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** or **Google Identity Services**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
7. Copy the **Client ID** to both backend and frontend `.env` files

### 4. Get Twilio Credentials (Optional)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get **Account SID** and **Auth Token** from dashboard
3. Create a Verify Service:
   - Go to **Verify** → **Services** → **Create**
   - Copy **Service SID**
4. Add to `backend/.env`

### 5. Restart Servers

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

---

## 🎯 Features Implemented

### ✅ Google OAuth
- **Login**: Sign in with Google account
- **Registration**: Create account with Google
- **Account Linking**: Links Google account to existing email account
- **Auto Role Selection**: Prompts for role on first-time registration

### ✅ Phone Number Authentication
- **OTP Verification**: 6-digit code sent via SMS
- **Login**: Sign in with phone number + OTP
- **Registration**: Create account with phone number + OTP
- **Mock Mode**: Works without Twilio in development (code: `123456`)
- **Code Expiry**: Codes expire after 10 minutes

### ✅ User Interface
- **Tabbed Interface**: Switch between Email, Google, and Phone auth
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Clear error messages
- **Loading States**: Visual feedback during authentication

---

## 📱 Usage

### For Users

#### Login
1. Go to `/login`
2. Choose authentication method:
   - **Email**: Enter email and password
   - **Google**: Click "Sign in with Google"
   - **Phone**: Enter phone number, receive OTP, enter code

#### Register
1. Go to `/register`
2. Select role (Client, Driver, or Car Wash)
3. Choose authentication method:
   - **Email**: Fill form with email/password
   - **Google**: Click "Sign up with Google" (role selected above)
   - **Phone**: Enter phone and name, receive OTP, enter code

---

## 🔧 API Endpoints

### Google Login/Register
```http
POST /api/auth/google
Content-Type: application/json

{
  "token": "google_id_token",
  "role": "client" // optional, required for new users
}
```

### Send OTP
```http
POST /api/auth/phone/send-code
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

**Response (Development):**
```json
{
  "success": true,
  "message": "Verification code sent",
  "code": "123456" // Only in development!
}
```

### Verify OTP
```http
POST /api/auth/phone/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456",
  "role": "client", // required for new users
  "name": "John Doe" // required for new users
}
```

---

## 🧪 Testing

### Development Mode

**Google OAuth:**
- Requires valid `GOOGLE_CLIENT_ID`
- Test with any Google account

**Phone OTP:**
- **Without Twilio**: Use mock code `123456`
- **With Twilio**: Real SMS will be sent
- Code is returned in response for testing (dev only)

### Production Mode

- Google OAuth: Requires valid credentials
- Phone OTP: Requires Twilio account
- OTP codes are NOT returned in responses

---

## 📝 Notes

1. **Password is optional** for OAuth/phone users
2. **NRC is auto-generated** for OAuth/phone users (format: `G-{googleId}` or `P-{phone}`)
3. **Email is placeholder** for phone-only users (format: `{phone}@sucar.placeholder`)
4. **Google accounts** can be linked to existing email accounts
5. **Phone verification** codes expire after 10 minutes
6. **Users should update** NRC and email after OAuth/phone registration

---

## 🔐 Security Considerations

1. **OTP codes** expire after 10 minutes
2. **Google tokens** are verified server-side using `google-auth-library`
3. **Phone numbers** are validated and formatted with country code
4. **Rate limiting** should be added for OTP requests (future enhancement)
5. **Production** should not return OTP codes in responses
6. **HTTPS required** for production OAuth

---

## 🆘 Troubleshooting

### Google OAuth Not Working
- ✅ Check `GOOGLE_CLIENT_ID` is set in both backend and frontend `.env`
- ✅ Verify redirect URI is authorized in Google Console
- ✅ Check browser console for errors
- ✅ Ensure Google+ API is enabled

### Phone OTP Not Working
- ✅ Check phone number format (must include country code, e.g., `+260971234567`)
- ✅ In development, use mock code `123456`
- ✅ Check Twilio credentials if using production
- ✅ Verify `TWILIO_VERIFY_SERVICE_SID` is correct

### Database Errors
- ✅ Run migration: `backend/scripts/migrate-oauth-phone.sql`
- ✅ Check Supabase connection
- ✅ Verify all columns exist in `users` table

---

## 📚 Files Created/Modified

### Backend
- ✅ `backend/scripts/migrate-oauth-phone.sql` - Database migration
- ✅ `backend/src/services/smsService.ts` - SMS/OTP service
- ✅ `backend/src/services/db-service.ts` - Updated with OAuth/phone methods
- ✅ `backend/src/controllers/authController.ts` - Google & phone auth controllers
- ✅ `backend/src/routes/authRoutes.ts` - New auth routes

### Frontend
- ✅ `frontend/src/components/auth/GoogleLoginButton.tsx` - Google OAuth component
- ✅ `frontend/src/components/auth/PhoneLogin.tsx` - Phone OTP component
- ✅ `frontend/src/pages/Login.tsx` - Updated with tabs for auth methods
- ✅ `frontend/src/pages/Register.tsx` - Updated with tabs for auth methods
- ✅ `frontend/src/context/AuthContext.tsx` - Added Google & phone methods
- ✅ `frontend/src/pages/Login.css` - Styles for auth tabs
- ✅ `frontend/src/pages/Register.css` - Styles for auth tabs

### Documentation
- ✅ `OAUTH_PHONE_AUTH_IMPLEMENTATION.md` - Implementation details
- ✅ `backend/ENV_VARIABLES.md` - Environment variables guide
- ✅ `OAUTH_PHONE_SETUP_GUIDE.md` - This file

---

## 🎉 You're All Set!

Users can now:
- ✅ Login/Register with Email & Password
- ✅ Login/Register with Google
- ✅ Login/Register with Phone Number

All three methods are fully integrated and working!
