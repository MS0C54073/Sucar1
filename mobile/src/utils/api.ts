/**
 * API Utility Functions
 * Centralized API configuration and error handling
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function normalizeApiUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/** Android emulators reach the dev machine via 10.0.2.2, not the LAN IP Metro reports. */
function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  if (Constants.isDevice === false) return true;
  const model = (Constants.platform as { android?: { model?: string } } | null)?.android?.model ?? '';
  return /sdk_gphone|Emulator|Android SDK built for x86|generic_x86|generic_x86_64/i.test(model);
}

function resolveDevApiUrl(): string {
  // 1) Explicit overrides (.env EXPO_PUBLIC_* or app.config extra)
  const fromPublicEnv =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL?.trim() : undefined;
  if (fromPublicEnv) return normalizeApiUrl(fromPublicEnv);

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return normalizeApiUrl(extra.apiUrl);

  // 2) Android emulator — always use the host loopback alias
  if (isAndroidEmulator()) {
    return 'http://10.0.2.2:5000/api';
  }

  // 3) Physical device — Metro host is the dev machine's LAN IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }

  // 4) Fallbacks
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}

export const API_URL = __DEV__
  ? resolveDevApiUrl()
  : normalizeApiUrl(
      process.env.EXPO_PUBLIC_API_URL?.trim() ||
        (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
        'https://your-production-api.com'
    );

if (__DEV__) {
  console.log(`📡 SuCAR API → ${API_URL}`);
}

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      if (__DEV__) {
        console.warn(`❌ Network Error (${API_URL}):`, error.message);
      }
      return Promise.reject({
        message: 'Network error. Please check your connection and ensure the backend is running.',
        code: 'NETWORK_ERROR',
      });
    }

    const status = error.response.status;
    const data = error.response.data as Record<string, unknown>;

    switch (status) {
      case 401:
        return Promise.reject({
          message: (data?.message as string) || 'Unauthorized. Please login again.',
          code: 'UNAUTHORIZED',
        });
      case 403:
        return Promise.reject({
          message: (data?.message as string) || 'Access forbidden.',
          code: 'FORBIDDEN',
        });
      case 404:
        return Promise.reject({
          message: (data?.message as string) || 'Resource not found.',
          code: 'NOT_FOUND',
        });
      case 422: {
        const validationErrors = (data?.errors as Record<string, string[]>) || {};
        const errorMessages = Object.values(validationErrors).flat().join('\n');
        return Promise.reject({
          message: errorMessages || 'Validation failed.',
          code: 'VALIDATION_ERROR',
          errors: validationErrors,
        });
      }
      case 500:
        return Promise.reject({
          message: (data?.message as string) || 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
        });
      default:
        return Promise.reject({
          message: (data?.message as string) || 'An error occurred. Please try again.',
          code: 'UNKNOWN_ERROR',
        });
    }
  }
);

/**
 * Test backend connection
 */
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const healthUrl = `${API_URL.replace(/\/api$/, '')}/api/health`;
    const response = await axios.get(healthUrl, {
      timeout: 10000,
      validateStatus: (status) => status < 500,
      headers: { Accept: 'application/json' },
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

export const showErrorAlert = (error: { message?: string }, title: string = 'Error') => {
  Alert.alert(title, error?.message || 'An error occurred');
};

export default apiClient;
