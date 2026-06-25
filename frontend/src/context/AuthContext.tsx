import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'driver' | 'carwash' | 'admin' | 'subadmin';
  adminLevel?: 'super_admin' | 'admin' | 'support';
  profilePictureUrl?: string;
  carWashPictureUrl?: string;
  bio?: string;
  address?: string;
  licenseNumber?: string;
  businessName?: string;
  carWashName?: string;
  location?: string;
  washingBays?: number;
  availability?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  loginWithGoogle?: (googleToken: string, role?: string) => Promise<any>;
  sendOTP?: (phone: string) => Promise<string | undefined>;
  verifyOTP?: (phone: string, code: string, role?: string, name?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In dev, use Vite proxy (/api → backend) so login works when only the proxy port differs
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const API_TIMEOUT_MS = 12000;

axios.defaults.timeout = API_TIMEOUT_MS;

function getLoginErrorMessage(error: any): string {
  if (!error.response) {
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout')
    ) {
      return 'Cannot reach the server. Start the backend: cd backend && npm run dev';
    }
    return error.message || 'Network error — is the backend running on port 5000?';
  }

  const data = error.response.data;
  if (data?.errors && typeof data.errors === 'object') {
    const firstField = Object.keys(data.errors)[0];
    const firstMsg = data.errors[firstField]?.[0];
    if (firstMsg) return firstMsg;
  }

  return data?.message || 'Login failed';
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to restore user from localStorage first (fast, no API call)
  const getStoredUser = (): User | null => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const storedTokenOnBoot = localStorage.getItem('token');
  const storedUserOnBoot = getStoredUser();
  const [user, setUser] = useState<User | null>(storedUserOnBoot);
  const [token, setToken] = useState<string | null>(storedTokenOnBoot);
  // Only block protected routes when we have a token but no cached profile yet
  const [loading, setLoading] = useState(!!storedTokenOnBoot && !storedUserOnBoot);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      void fetchUser();
      return;
    }

    void fetchUser();
    const safetyTimer = window.setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(safetyTimer);
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { timeout: API_TIMEOUT_MS });

      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      if (response.data.success === false) {
        throw new Error(response.data.message || 'Failed to fetch user');
      }

      const userData = response.data.data;

      // Validate user data
      if (!userData || !userData.id || !userData.role) {
        throw new Error('Invalid user data received');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('❌ Error fetching user:', error);

      // Only clear auth if it's an authentication error (401/403)
      // Network errors or other issues shouldn't log the user out
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('🔒 Authentication failed, clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } else {
        // For other errors, keep the cached user but log the error
        console.warn('⚠️ Failed to refresh user data, using cached data');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      console.log('🔐 Attempting login...');
      console.log('   API URL:', `${API_URL}/auth/login`);
      console.log('   Email:', normalizedEmail);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email: normalizedEmail, password },
        { timeout: API_TIMEOUT_MS }
      );

      console.log('   Response status:', response.status);
      console.log('   Response data:', response.data);

      if (!response.data.success) {
        console.error('❌ Login failed: Server returned success: false');
        throw new Error(response.data.message || 'Login failed');
      }

      const { token: newToken, ...userData } = response.data.data;

      if (!newToken) {
        console.error('❌ Login failed: No token in response');
        throw new Error('No token received from server');
      }

      console.log('✅ Login successful!');
      console.log('   User:', userData.name, `(${userData.role})`);

      // Set token and user immediately (no blocking API call)
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return userData as User;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      console.error('   Error message:', error.message);

      throw new Error(getLoginErrorMessage(error));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const loginWithGoogle = async (googleToken: string, role?: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: googleToken,
        role: role || 'client',
      });

      if (response.data.success) {
        const { token: newToken, ...userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return userData;
      }
      throw new Error(response.data.message || 'Google login failed');
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Google login failed');
    }
  };

  const sendOTP = async (phone: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/phone/send-code`, { phone });
      if (response.data.success) {
        return response.data.code; // Returns code in dev mode
      }
      throw new Error(response.data.message || 'Failed to send OTP');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (phone: string, code: string, role?: string, name?: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/phone/verify`, {
        phone,
        code,
        role,
        name,
      });

      if (response.data.success) {
        const { token: newToken, ...userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return userData;
      }
      throw new Error(response.data.message || 'OTP verification failed');
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw new Error(error.response?.data?.message || error.message || 'OTP verification failed');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading,
      loginWithGoogle,
      sendOTP,
      verifyOTP,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
