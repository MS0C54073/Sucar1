/**
 * Google sign-in for the mobile app via expo-auth-session.
 *
 * Requests a Google ID token and posts it to the backend (/auth/google) through
 * AuthContext.loginWithGoogle. Client IDs come from app config `extra`
 * (set via EXPO_PUBLIC_GOOGLE_* env vars — see GOOGLE_AUTH_SETUP.md).
 *
 * Works in Expo Go (web client + auth proxy) and in native builds
 * (Android / iOS clients). If no Web client id is configured, `configured`
 * is false so the UI can show a "not configured" state instead of failing.
 */
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';

// Finish any pending auth session when the app is reopened from the browser.
WebBrowser.maybeCompleteAuthSession();

interface GoogleExtra {
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
}

interface UseGoogleAuthOptions {
  role?: 'client' | 'driver';
  onError?: (message: string) => void;
  onSuccess?: () => void;
}

export function useGoogleAuth({ role, onError, onSuccess }: UseGoogleAuthOptions = {}) {
  const { loginWithGoogle } = useAuth();
  const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;
  const webClientId = extra.googleWebClientId;
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    androidClientId: extra.googleAndroidClientId,
    iosClientId: extra.googleIosClientId,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken =
        response.params?.id_token || (response.authentication as any)?.idToken;
      if (!idToken) {
        onError?.('Google did not return an ID token. Check your OAuth client setup.');
        return;
      }
      setLoading(true);
      loginWithGoogle(idToken, role)
        .then(() => onSuccess?.())
        .catch((e: any) => onError?.(e?.message || 'Google sign-in failed.'))
        .finally(() => setLoading(false));
    } else if (response.type === 'error') {
      onError?.(response.error?.message || 'Google sign-in failed. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    configured: Boolean(webClientId),
    loading,
    /** Disabled until the auth request is ready or while a sign-in is in flight. */
    disabled: !request || loading,
    signIn: () => promptAsync(),
  };
}
