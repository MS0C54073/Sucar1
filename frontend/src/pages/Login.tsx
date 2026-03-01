import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PageLayout from '../components/PageLayout';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import PhoneLogin from '../components/auth/PhoneLogin';
import DownloadAppSection from '../components/DownloadAppSection';
import BackgroundCars from '../components/animations/BackgroundCars';
import FloatingElements from '../components/animations/FloatingElements';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './Login.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

type AuthMethod = 'email' | 'google' | 'phone';

type LoginContentProps = {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  authMethod: AuthMethod;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onChangeAuthMethod: (m: AuthMethod) => void;
  onSubmit: (e: React.FormEvent) => void;
  onChildError: (msg: string) => void;
  googleClientId: string;
};

const LoginContent = memo(({
  email,
  password,
  error,
  loading,
  authMethod,
  onChangeEmail,
  onChangePassword,
  onChangeAuthMethod,
  onSubmit,
  onChildError,
  googleClientId,
}: LoginContentProps) => {
  return (
    <div className="login-container">
      <BackgroundCars count={5} speed="slow" />
      <FloatingElements type="bubbles" count={8} intensity="low" />
      <FloatingElements type="sparkles" count={6} intensity="low" />
      <div className="login-box">
        <div className="login-logo-container">
          <img 
            src="/images/Sucar.png" 
            alt="SuCAR Logo" 
            className="login-logo"
          />
        </div>
        <h1>SuCAR</h1>
        <h2>Car Wash Booking System</h2>

        {/* Auth Method Selector */}
        <div className="auth-method-tabs">
          <button
            className={authMethod === 'email' ? 'active' : ''}
            onClick={() => onChangeAuthMethod('email')}
          >
            Email
          </button>
          <button
            className={authMethod === 'google' ? 'active' : ''}
            onClick={() => onChangeAuthMethod('google')}
          >
            Google
          </button>
          <button
            className={authMethod === 'phone' ? 'active' : ''}
            onClick={() => onChangeAuthMethod('phone')}
          >
            Phone
          </button>
        </div>

        {/* Email/Password Login */}
        {authMethod === 'email' && (
          <form onSubmit={onSubmit}>
            <div style={{ minHeight: 24 }} aria-live="polite" aria-atomic="true">
              {error && <div className="error-message">{error}</div>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => onChangeEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* Google Login */}
        {authMethod === 'google' && (
          <div className="google-login-section">
            {googleClientId ? (
              <GoogleLoginButton
                role="client"
                onSuccess={() => {}}
                onError={(err) => onChildError(err)}
              />
            ) : (
              <div className="error-message">
                Google login is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
              </div>
            )}
          </div>
        )}

        {/* Phone Login */}
        {authMethod === 'phone' && (
          <PhoneLogin
            mode="login"
            onSuccess={() => {}}
            onError={(err) => onChildError(err)}
          />
        )}

        <p className="login-note">
          <a href="/register">Don't have an account? Register</a>
        </p>

        {/* Download App Section */}
        <div className="login-download-section">
          <DownloadAppSection variant="compact" />
        </div>
      </div>
    </div>
  );
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in (side-effect, not during render)
  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'carwash') navigate('/carwash');
    else if (user.role === 'driver') navigate('/driver');
    else if (user.role === 'client') navigate('/client');
  }, [user, navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation handled by useEffect when user updates
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  

  return (
    <PageLayout>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <LoginContent
            email={email}
            password={password}
            error={error}
            loading={loading}
            authMethod={authMethod}
            onChangeEmail={setEmail}
            onChangePassword={setPassword}
            onChangeAuthMethod={setAuthMethod}
            onSubmit={handleSubmit}
            onChildError={setError}
            googleClientId={GOOGLE_CLIENT_ID}
          />
        </GoogleOAuthProvider>
      ) : (
        <LoginContent
          email={email}
          password={password}
          error={error}
          loading={loading}
          authMethod={authMethod}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          onChangeAuthMethod={setAuthMethod}
          onSubmit={handleSubmit}
          onChildError={setError}
          googleClientId={GOOGLE_CLIENT_ID}
        />
      )}
    </PageLayout>
  );
};

export default Login;
