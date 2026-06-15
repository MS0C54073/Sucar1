# Google Sign-in Setup

SuCAR supports "Continue with Google" on the web app and the mobile apps. It is
disabled by default and turns on as soon as you supply OAuth client IDs. This
guide walks through creating those IDs in Google Cloud Console and wiring them
into each part of the stack.

When you finish you will have:

| Where | Variable | Comes from |
| --- | --- | --- |
| backend | `GOOGLE_CLIENT_ID` | Web application client |
| backend | `GOOGLE_ANDROID_CLIENT_ID` | Android client (optional) |
| backend | `GOOGLE_IOS_CLIENT_ID` | iOS client (optional) |
| frontend (web) | `VITE_GOOGLE_CLIENT_ID` | the same Web application client |
| mobile | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | the same Web application client |
| mobile | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android client |
| mobile | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS client |

The backend verifies every incoming Google ID token against the client IDs you
list, so the **Web client ID must match** in the backend, the web app, and the
mobile app. The Android/iOS IDs are only needed when you ship standalone mobile
builds.

---

## 1. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Top bar project picker → **New Project**. Name it (e.g. `SuCAR`) → **Create**.
3. Select the new project.

## 2. Configure the OAuth consent screen

1. Left menu → **APIs & Services → OAuth consent screen**.
2. User type: **External** → **Create**.
3. Fill in the required fields:
   - App name: `SuCAR`
   - User support email: your email
   - Developer contact email: your email
4. **Save and Continue** through Scopes (the default `email`, `profile`,
   `openid` are enough — no extra scopes needed).
5. On **Test users**, add the Google accounts you will sign in with while the
   app is unpublished, then **Save and Continue**.

You can leave the app in "Testing" mode during development. Publish it later for
public users.

## 3. Create the OAuth client IDs

Left menu → **APIs & Services → Credentials → Create Credentials → OAuth client
ID**. Repeat once per platform you need.

### 3a. Web application (required)

This single client powers the web app and is the audience the backend trusts.

- Application type: **Web application**
- Name: `SuCAR Web`
- **Authorized JavaScript origins** — add each origin the web app runs on:
  - `http://localhost:5173` (Vite dev)
  - your production domain, e.g. `https://app.sucar.example`
- **Authorized redirect URIs** — the app uses Google Identity Services (token
  flow), so a redirect URI is not strictly required, but add the same origins
  if Google asks.
- **Create**, then copy the **Client ID** (looks like
  `1234567890-abcdef.apps.googleusercontent.com`).

Use this value for `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`, and
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

### 3b. Android client (optional — for standalone Android builds)

In Expo Go you can rely on the Web client alone, but a published Android build
needs its own client.

- Application type: **Android**
- Name: `SuCAR Android`
- **Package name**: `com.sucar.client` (and create a second client with
  `com.sucar.driver` for the Driver app).
- **SHA-1 certificate fingerprint**: from your signing key. For an EAS build:
  ```
  eas credentials
  ```
  (select Android → view the SHA-1), or for a local debug key:
  ```
  keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android
  ```
- **Create**, copy the Client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (and
  `GOOGLE_ANDROID_CLIENT_ID` on the backend).

### 3c. iOS client (optional — for standalone iOS builds)

- Application type: **iOS**
- Name: `SuCAR iOS`
- **Bundle ID**: `com.sucar.client` (and `com.sucar.driver` for Driver).
- **Create**, copy the Client ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (and
  `GOOGLE_IOS_CLIENT_ID` on the backend).

---

## 4. Wire the IDs into each app

### Backend (`backend/.env`)

```
GOOGLE_CLIENT_ID=1234567890-web.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=1234567890-android.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=1234567890-ios.apps.googleusercontent.com
```

Only `GOOGLE_CLIENT_ID` is required; leave the others blank if you are not
shipping mobile yet. With none set, `POST /api/auth/google` returns
"Google sign-in is not configured on the server."

### Web (`frontend/.env`)

```
VITE_GOOGLE_CLIENT_ID=1234567890-web.apps.googleusercontent.com
```

The "Continue with Google" button only renders when this is set; otherwise the
login page shows a note telling you to set it. Restart `npm run dev` after
editing `.env`.

### Mobile (`mobile/.env`)

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234567890-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=1234567890-android.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1234567890-ios.apps.googleusercontent.com
```

The mobile button stays inactive until at least the Web client ID is present.
Restart the Expo dev server with cache cleared after editing:
```
npx expo start -c
```

---

## 5. How it works end to end

1. The user taps **Continue with Google**.
2. Google returns an **ID token** (a signed JWT) to the app — never a password.
3. The app posts `{ token, role }` to `POST /api/auth/google`.
4. The backend verifies the token signature and that its audience is one of the
   configured client IDs, then:
   - links the Google account to an existing user with the same email, or
   - creates a new account with the requested role (only the self-registerable
     roles `client` / `driver` are allowed — privileged roles can never be
     self-assigned via Google), or
   - signs in the matching Google account.
5. The backend returns SuCAR's own JWT, and the app stores it like a normal
   login.

The mobile and web apps reject a Google account whose role does not match the
current app (e.g. a driver account in the Client app), the same way the
password login does.

---

## 6. Troubleshooting

- **Button does not appear (web):** `VITE_GOOGLE_CLIENT_ID` is unset or the dev
  server was not restarted.
- **Button says "Not configured" (mobile):** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  is unset; restart Expo with `-c`.
- **"Google sign-in is not configured on the server":** no `GOOGLE_*` client IDs
  in `backend/.env`.
- **"Google authentication failed" / audience mismatch:** the client ID that
  minted the token is not listed on the backend. Make sure the Web client ID is
  identical across backend, web, and mobile, and that the Android/iOS client IDs
  are also set on the backend when testing native builds.
- **`redirect_uri_mismatch` (web):** add the exact origin (scheme + host + port)
  to the Web client's Authorized JavaScript origins.
- **`Error 403: access_denied` while testing:** add your Google account under
  OAuth consent screen → Test users, or publish the app.
