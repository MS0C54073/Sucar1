# OAuth & Phone Number Authentication Implementation Plan

## Overview
This document outlines the implementation of Google OAuth and phone number authentication for the SuCAR application.

## Features to Implement

### 1. Google OAuth Login/Registration
- Google Sign-In button on login page
- Google Sign-Up button on registration page
- Automatic account creation for new Google users
- Link Google account to existing email accounts

### 2. Phone Number Authentication
- Phone number input on registration
- SMS verification code system
- Phone number login option
- Password recovery via SMS

## Implementation Steps

### Phase 1: Backend Setup

#### 1.1 Install Required Dependencies
```bash
cd backend
npm install passport passport-google-oauth20 twilio
npm install --save-dev @types/passport @types/passport-google-oauth20
```

#### 1.2 Environment Variables
Add to `backend/.env`:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### 1.3 Database Schema Updates
Add new columns to `users` table:
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN phone_verification_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';

CREATE INDEX idx_users_google_id ON users(google_id);
```

#### 1.4 Create New Services

**File: `backend/src/services/smsService.ts`**
- Send SMS verification codes
- Verify SMS codes
- Handle SMS errors

**File: `backend/src/services/oauthService.ts`**
- Google OAuth integration
- User creation/linking from OAuth
- Token management

#### 1.5 Update Auth Controller
Add new endpoints:
- `POST /api/auth/phone/send-code` - Send verification code
- `POST /api/auth/phone/verify` - Verify phone and login
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Handle Google callback
- `POST /api/auth/google/mobile` - Handle mobile OAuth token

### Phase 2: Frontend Setup

#### 2.1 Install Google OAuth Library
```bash
cd frontend
npm install @react-oauth/google
```

#### 2.2 Update Login Page
- Add "Continue with Google" button
- Add phone number login option
- Add phone verification code input

#### 2.3 Update Registration Page  
- Add "Sign up with Google" button
- Add phone number field
- Add SMS verification flow

#### 2.4 Create New Components
- `PhoneAuth.tsx` - Phone number authentication
- `GoogleAuthButton.tsx` - Google OAuth button
- `PhoneVerification.tsx` - SMS code verification

### Phase 3: Security Considerations

1. **Rate Limiting**: Limit SMS sends to prevent abuse
2. **Code Expiry**: SMS codes expire after 10 minutes
3. **Retry Logic**: Max 3 verification attempts
4. **Google Token Validation**: Verify tokens server-side
5. **CSRF Protection**: Add state parameter for OAuth

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── passport.ts (NEW)
│   ├── controllers/
│   │   └── authController.ts (UPDATE)
│   ├── services/
│   │   ├── smsService.ts (NEW)
│   │   └── oauthService.ts (NEW)
│   ├── routes/
│   │   └── authRoutes.ts (UPDATE)
│   └── middleware/
│       └── rateLimiter.ts (NEW)

frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── GoogleAuthButton.tsx (NEW)
│   │   │   ├── PhoneAuth.tsx (NEW)
│   │   │   └── PhoneVerification.tsx (NEW)
│   └── pages/
│       ├── Login.tsx (UPDATE)
│       └── Register.tsx (UPDATE)
```

## Testing Checklist

### Google OAuth
- [ ] Google login creates new account for new users
- [ ] Google login links to existing email accounts
- [ ] Google profile data (name, email) imported correctly
- [ ] Token refresh works properly
- [ ] Error handling for OAuth failures

### Phone Authentication
- [ ] SMS code sent successfully
- [ ] SMS code verification works
- [ ] Expired codes rejected
- [ ] Invalid codes rejected properly
- [ ] Rate limiting prevents spam
- [ ] Phone number format validation

### Security
- [ ] Passwords hashed for local auth
- [ ] JWT tokens secured
- [ ] OAuth tokens validated
- [ ] Phone verification codes expire
- [ ] Rate limiting enforced

## Rollout Plan

### Step 1: Development (Current)
- Set up development Google OAuth credentials
- Use Twilio trial account for SMS testing
- Test with test phone numbers

### Step 2: Staging
- Set up staging OAuth credentials
- Configure production Twilio account
- Test with real phone numbers

### Step 3: Production
- Set up production OAuth credentials
- Enable production Twilio
- Monitor usage and errors
- Set up alerts for failures

## Cost Considerations

### Twilio SMS Costs
- USA: $0.0079 per SMS
- International: Varies by country
- Monthly estimate (1000 users): ~$8-$50

### Google OAuth
- Free for standard usage
- No per-user costs

## Alternatives Considered

1. **Firebase Auth** - Full auth solution (considered overkill)
2. **Auth0** - Paid service (not in budget)
3. **AWS Cognito** - Complex setup
4. **SMS.to API** - Alternative to Twilio
5. **Email OTP** - Slower than SMS (kept as backup)

## Next Steps

1. Get approval for Twilio account setup
2. Obtain Google OAuth credentials
3. Implement backend services
4. Update frontend components
5. Test thoroughly
6. Deploy to staging
7. User acceptance testing
8. Production rollout

## Documentation Updates Needed

- User Guide: How to login with Google
- User Guide: How to verify phone number
- API Documentation: New auth endpoints
- Admin Guide: Managing OAuth users

---

**Note**: This is a significant feature that requires external service setup (Google Cloud Console, Twilio). Please confirm you want to proceed with implementation before I begin coding.
