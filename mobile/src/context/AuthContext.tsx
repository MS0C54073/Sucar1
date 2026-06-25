import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiClient } from '../utils/api';
import { getRequiredRole, getOtherAppName, getAppDisplayName } from '../config/appVariant';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'driver' | 'carwash' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  sendPhoneCode: (phone: string) => Promise<{ devCode?: string }>;
  loginWithPhone: (phone: string, code: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Android's AsyncStorage (SQLite) caps a single row at ~2MB (CursorWindow).
// Persisting a user object that carries a base64 image (e.g. a data-URL avatar)
// blows past that limit and corrupts session restore
// ("Row too big to fit into CursorWindow"). We keep the full user in memory but
// persist a slim copy: large/base64 fields are dropped and can be refetched from
// the API (GET /auth/me) when needed.
const LARGE_FIELD_KEYS = [
  'profilePictureUrl',
  'carWashPictureUrl',
  'avatar',
  'avatarUrl',
  'image',
  'photo',
  'bio',
];
const MAX_PERSISTED_FIELD_LENGTH = 20000;

function toStoredUser(user: Record<string, any> | null | undefined): Record<string, any> {
  const slim: Record<string, any> = {};
  for (const key of Object.keys(user ?? {})) {
    if (LARGE_FIELD_KEYS.includes(key)) continue;
    const value = (user as Record<string, any>)[key];
    if (typeof value === 'string' && value.length > MAX_PERSISTED_FIELD_LENGTH) continue;
    slim[key] = value;
  }
  return slim;
}

/**
 * Provides authentication state and helpers (phone-OTP sign-in, logout) to the
 * rest of the app using React Context.
 *
 * On mount it attempts to restore a previously saved user + token from
 * AsyncStorage and wires the token into axios/apiClient headers, so a signed-in
 * user stays signed in across app restarts (no credentials re-entry).
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  /**
   * Load any previously persisted user and token from AsyncStorage
   * so the user stays logged in across app restarts.
   */
  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      // A corrupted/oversized row (or bad JSON) must not wedge startup — clear it
      // so the app falls back to the login screen and self-recovers next launch.
      console.error('Error loading stored auth:', error);
      try {
        await AsyncStorage.multiRemove(['token', 'user']);
      } catch (clearError) {
        console.error('Failed to clear corrupted auth storage:', clearError);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request an SMS verification code for phone-OTP sign-in.
   * In development the backend returns the code so it can be auto-filled.
   */
  const sendPhoneCode = async (phone: string): Promise<{ devCode?: string }> => {
    try {
      const response = await apiClient.post('/auth/phone/send-code', { phone });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Could not send the verification code');
      }
      return { devCode: response.data.code };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please check your connection and that the backend is running.');
      }
      throw new Error(error.response?.data?.message || error.message || 'Could not send the verification code');
    }
  };

  /**
   * Verify a phone OTP and sign in. New accounts are created with this app
   * variant's role (client / driver); `name` is only used for first-time sign-up.
   * Persists the token + user so the session survives app restarts.
   */
  const loginWithPhone = async (phone: string, code: string, name?: string) => {
    try {
      const response = await apiClient.post('/auth/phone/verify', {
        phone,
        code,
        role: getRequiredRole(),
        name,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Verification failed');
      }

      const { token: newToken, ...userData } = response.data.data;
      if (!newToken) {
        throw new Error('No token received from server');
      }

      const requiredRole = getRequiredRole();
      if (userData.role !== requiredRole) {
        throw new Error(
          `This account is for ${userData.role}s. Please use ${getOtherAppName()} or sign in with a ${requiredRole} account in ${getAppDisplayName()}.`
        );
      }

      setUser(userData);
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(toStoredUser(userData)));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      console.error('❌ Phone sign-in error:', error);
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired code. Please try again.');
      }
      throw new Error(error.response?.data?.message || error.message || 'Verification failed. Please try again');
    }
  };

  /**
   * Clear all locally stored authentication state and headers,
   * effectively logging the user out on this device.
   */
  const logout = async (): Promise<void> => {
    try {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, sendPhoneCode, loginWithPhone, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Convenience hook to access the authentication context.
 * Must be used within an <AuthProvider>.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
