import { memo, useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PageLayout from '../components/PageLayout';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import PhoneLogin from '../components/auth/PhoneLogin';
import ThemeToggle from '../components/ThemeToggle';
import AuthMapBackground from '../components/auth/AuthMapBackground';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../components/auth/AuthMapBackground.css';
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
  apiOnline: boolean | null;
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

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
  apiOnline,
}: LoginContentProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-screen">
      <div className="login-page">
      <aside className="login-brand">
        <div className="login-brand-inner">
          <img src="/images/Sucarcar.jpeg" alt="" className="login-brand-logo" />
          <h1 className="login-brand-title">SuCAR</h1>
          <p className="login-brand-tagline">
            Book pickup, drive-in, or delivery car wash — all in one place.
          </p>
          <ul className="login-brand-features">
            <li>Find nearby washes instantly</li>
            <li>Track your driver in real time</li>
            <li>Manage vehicles &amp; bookings</li>
          </ul>
        </div>
      </aside>

      <div className="login-panel">
        <div className="login-panel-top">
          <Link to="/" className="login-back">
            ← Home
          </Link>
          <ThemeToggle />
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <img src="/images/Sucarcar.jpeg" alt="SuCar" className="login-card-logo" />
            <h2>Sign in</h2>
            <p>Welcome back — choose how you&apos;d like to continue</p>
          </div>

          <div className="segmented-control login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'email'}
              className={authMethod === 'email' ? 'active' : ''}
              onClick={() => onChangeAuthMethod('email')}
            >
              Email
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'google'}
              className={authMethod === 'google' ? 'active' : ''}
              onClick={() => onChangeAuthMethod('google')}
            >
              Google
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'phone'}
              className={authMethod === 'phone' ? 'active' : ''}
              onClick={() => onChangeAuthMethod('phone')}
            >
              Phone
            </button>
          </div>

          {apiOnline === false && (
            <div className="alert alert-error login-api-banner" role="alert">
              Backend is not running. Open a second terminal and run:{' '}
              <code>cd backend</code> then <code>npm run dev</code> (port 5000).
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {authMethod === 'email' && (
            <form onSubmit={onSubmit} className="login-form">
              <div className="form-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => onChangeEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="login-password">Password</label>
                <div className="password-field">
                  <input
                    id="login-password"
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => onChangePassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-field-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg login-submit">
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          )}

          {authMethod === 'google' && (
            <div className="login-alt-panel">
              {googleClientId ? (
                <GoogleLoginButton
                  role="client"
                  onSuccess={() => {}}
                  onError={(err) => onChildError(err)}
                />
              ) : (
                <p className="login-alt-hint">
                  Google sign-in is not configured. Use email or phone, or set{' '}
                  <code>VITE_GOOGLE_CLIENT_ID</code> in your environment.
                </p>
              )}
            </div>
          )}

          {authMethod === 'phone' && (
            <div className="login-alt-panel">
              <PhoneLogin
                mode="login"
                onSuccess={() => {}}
                onError={(err) => onChildError(err)}
              />
            </div>
          )}

          <p className="login-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>

          {import.meta.env.DEV && (
            <div className="login-dev-hints" style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Test accounts</strong>
              <br />
              Admin: admin@sucar.com / admin123
              <br />
              Client: john.mwansa@email.com / client123
              <br />
              Driver: james.mulenga@driver.com / driver123
              <br />
              Car wash: sparkle@carwash.com / carwash123
            </div>
          )}
        </div>
      </div>
      </div>
      <AuthMapBackground />
    </div>
  );
});

function dashboardPath(role: string): string {
  if (role === 'admin' || role === 'subadmin') return '/admin';
  if (role === 'carwash') return '/carwash';
  if (role === 'driver') return '/driver';
  return '/client';
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/health', { timeout: 4000 })
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        const loggedInUser = await login(email, password);
        navigate(dashboardPath(loggedInUser.role), { replace: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Login failed — check email and password';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, navigate]
  );

  if (authLoading) {
    return (
      <PageLayout showHeader={false}>
        <div className="app-boot-screen">
          <p>Loading…</p>
        </div>
      </PageLayout>
    );
  }

  if (user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  const content = (
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
      apiOnline={apiOnline}
    />
  );

  return (
    <PageLayout showHeader={false}>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
      ) : (
        content
      )}
    </PageLayout>
  );
};

export default Login;
