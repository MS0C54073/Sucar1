/**
 * API Utility Functions
 * Centralized API configuration and error handling
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_URL = __DEV__
  ? 'http://172.20.10.6:5000/api' // ID: 172.20.10.6 (Machine IP for physical device & emulator)
  : 'https://your-production-api.com/api'; // Production API URL

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from AsyncStorage
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection and ensure the backend is running.',
        code: 'NETWORK_ERROR',
      });
    }

    // Handle HTTP errors
    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 401:
        console.error('❌ Unauthorized:', data?.message);
        return Promise.reject({
          message: data?.message || 'Unauthorized. Please login again.',
          code: 'UNAUTHORIZED',
        });
      case 403:
        console.error('❌ Forbidden:', data?.message);
        return Promise.reject({
          message: data?.message || 'Access forbidden.',
          code: 'FORBIDDEN',
        });
      case 404:
        console.error('❌ Not Found:', data?.message);
        return Promise.reject({
          message: data?.message || 'Resource not found.',
          code: 'NOT_FOUND',
        });
      case 422:
        console.error('❌ Validation Error:', data?.errors);
        const validationErrors = data?.errors || {};
        const errorMessages = Object.values(validationErrors).flat().join('\n');
        return Promise.reject({
          message: errorMessages || 'Validation failed.',
          code: 'VALIDATION_ERROR',
          errors: validationErrors,
        });
      case 500:
        console.error('❌ Server Error:', data?.message);
        return Promise.reject({
          message: data?.message || 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
        });
      default:
        console.error('❌ API Error:', data?.message || error.message);
        return Promise.reject({
          message: data?.message || 'An error occurred. Please try again.',
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
    // Construct health check URL correctly
    const baseUrl = API_URL.replace('/api', '');
    const healthUrl = `${baseUrl}/api/health`;
    console.log(`🔍 Testing backend connection...`);
    console.log(`   Health URL: ${healthUrl}`);
    console.log(`   API Base URL: ${baseUrl}`);
    console.log(`   Full API URL: ${API_URL}`);

    const response = await axios.get(healthUrl, {
      timeout: 10000, // 10 seconds timeout
      validateStatus: (status) => status < 500, // Accept any status < 500
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = response.data;
      if (data?.success) {
        console.log('✅ Backend connection successful');
        console.log(`   Backend message: ${data.message || 'Connected'}`);
        console.log(`   Environment: ${data.environment || 'unknown'}`);
        return true;
      } else {
        console.warn(`⚠️ Backend responded but success=false`);
        console.warn(`   Response: ${JSON.stringify(data)}`);
        // Still return true if we got a 200 response
        return true;
      }
    }

    console.warn(`⚠️ Backend responded with status: ${response.status}`);
    return false;
  } catch (error: any) {
    console.error('❌ Backend connection test failed');
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);

    // Detailed error analysis
    if (error.code === 'ECONNREFUSED' ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('connection refused')) {
      console.error('');
      console.error('💡 CONNECTION REFUSED - Backend is not running or not accessible');
      console.error('');
      console.error('   🔧 To fix:');
      console.error('   1. Open a NEW terminal/PowerShell window');
      console.error('   2. Navigate to backend: cd backend');
      console.error('   3. Start backend: npm run dev');
      console.error('   4. Wait for these messages:');
      console.error('      ✅ Supabase connected successfully');
      console.error('      🚀 SuCAR API Server');
      console.error('      Port: 5000');
      console.error('');
      console.error('   5. Test in browser: http://localhost:5000/api/health');
      console.error('   6. Then try the mobile app again');
      console.error('');
    } else if (error.code === 'ETIMEDOUT' ||
      error.code === 'TIMEOUT' ||
      error.message?.includes('timeout')) {
      console.error('');
      console.error('💡 CONNECTION TIMEOUT - Backend may be slow or unreachable');
      console.error('');
      console.error('   🔧 To fix:');
      console.error('   1. Check if backend is running: http://localhost:5000/api/health');
      console.error('   2. Check backend terminal for errors');
      console.error('   3. Try restarting backend');
      console.error('');
    } else if (error.message?.includes('Network Error') ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('ERR_NETWORK')) {
      console.error('');
      console.error('💡 NETWORK ERROR - Cannot reach backend');
      console.error('');
      console.error('   🔧 For Android Emulator:');
      console.error('   1. Ensure backend is running on localhost:5000');
      console.error('   2. Backend should listen on 0.0.0.0 (all interfaces)');
      console.error('   3. App uses: http://10.0.2.2:5000/api');
      console.error('   4. Test from emulator browser: http://10.0.2.2:5000/api/health');
      console.error('   5. Check Windows Firewall allows Node.js');
      console.error('');
    } else if (error.response) {
      // Got a response but it's an error status
      console.error('');
      console.error(`💡 Backend responded with status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
      console.error('');
    } else {
      console.error('');
      console.error('💡 UNKNOWN CONNECTION ERROR');
      console.error(`   Full error details:`);
      console.error(`   ${JSON.stringify({
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      }, null, 2)}`);
      console.error('');
    }

    console.error(`   📍 Current Configuration:`);
    console.error(`   API URL: ${API_URL}`);
    console.error(`   Base URL: ${API_URL.replace('/api', '')}`);
    console.error(`   Health Check: ${API_URL.replace('/api', '')}/api/health`);
    console.error('');

    return false;
  }
};

/**
 * Show user-friendly error alert
 */
export const showErrorAlert = (error: any, title: string = 'Error') => {
  const message = error?.message || error?.response?.data?.message || 'An error occurred';
  Alert.alert(title, message);
};

export default apiClient;
