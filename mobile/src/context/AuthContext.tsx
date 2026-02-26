import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiClient, API_URL, testBackendConnection } from '../utils/api';

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
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API_URL is now imported from utils/api.ts
// For Android Emulator: uses 10.0.2.2 to access localhost
// For iOS Simulator: uses localhost
// For Physical Device: use your computer's IP address

/**
 * Provides authentication state and helpers (login, register, logout)
 * to the rest of the app using React Context.
 *
 * On mount it attempts to restore a previously saved user + token
 * from AsyncStorage and wires the token into axios/apiClient headers.
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
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Attempt to authenticate the user with email + password against
   * the backend API, then persist the returned token and user profile.
   *
   * Throws descriptive errors that are formatted for display in the UI.
   */
  const login = async (email: string, password: string) => {
    try {
      // Test backend connection first
      const isBackendAvailable = await testBackendConnection();
      if (!isBackendAvailable) {
        throw new Error('Cannot connect to server. Please ensure:\n1. Backend is running\n2. Correct API URL configured\n3. Network connection is active');
      }

      console.log(`🔐 Attempting login to: ${API_URL}/auth/login`);
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      const { token: newToken, ...userData } = response.data.data;
      
      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      console.log(`✅ Login successful for: ${userData.name} (${userData.role})`);
      
      // Set user state first to trigger navigation
      setUser(userData);
      setToken(newToken);
      
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log(`👤 User state updated: ${userData.name} (${userData.role})`);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Provide better error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please check:\n1. Backend is running\n2. Correct API URL\n3. Network connection');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Login failed. Please try again');
      }
    }
  };

  /**
   * Create a new user account on the backend and, on success,
   * immediately log the user in and persist their auth state.
   */
  const register = async (userData: any) => {
    try {
      // Test backend connection first
      console.log('🔍 Testing backend connection before registration...');
      const isBackendAvailable = await testBackendConnection();
      if (!isBackendAvailable) {
        const errorMsg = `Cannot connect to server.\n\nPlease ensure:\n• Backend is running (cd backend && npm run dev)\n• Backend is accessible at ${API_URL.replace('/api', '')}\n• Network connection is active\n\nFor Android emulator:\n• Backend should run on localhost:5000\n• App uses: http://10.0.2.2:5000/api`;
        throw new Error(errorMsg);
      }

      console.log(`📝 Attempting registration to: ${API_URL}/auth/register`);
      const response = await apiClient.post('/auth/register', userData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }
      
      const { token: newToken, ...user } = response.data.data;
      
      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      console.log(`✅ Registration successful for: ${user.name} (${user.role})`);
      
      setToken(newToken);
      setUser(user);
      
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Provide better error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please check:\n1. Backend is running\n2. Correct API URL\n3. Network connection');
      } else if (error.response?.status === 409) {
        throw new Error('User already exists with this email or NRC');
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        const errorMsg = Object.values(validationErrors || {}).flat().join('\n');
        throw new Error(errorMsg || 'Validation failed. Please check your input');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Registration failed. Please try again');
      }
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
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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
