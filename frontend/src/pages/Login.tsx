import { memo, useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PageLayout from '../components/PageLayout';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import PhoneLogin from '../components/auth/PhoneLogin';
import Icon from '../components/icons/Icon';
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

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const TEST_ACCOUNTS = [
  { role: 'Admin', cred: 'admin@sucar.com / admin123', color: '#f59e0b' },
  { role: 'Client', cred: 'john.mwansa@email.com / client123', color: '#ec4899' },
  { role: 'Driver', cred: 'james.mulenga@driver.com / driver123', color: '#a855f7' },
  { role: 'Car wash', cred: 'sparkle@carwash.com / carwash123', color: '#22d3ee' },
];

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
  const [remember, setRemember] = useState(true);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="login-screen">
      <button
        type="button"
        className="login-darkmode"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
        <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
      </button>

      <div className="login-page">
        <aside className="login-brand">
          <div className="login-brand-inner">
            <div className="login-brand-wordmark">
              <span className="login-brand-s">S</span>uCAR
            </div>
            <p className="login-brand-tagline">
              Book pickup, drive-in, or delivery<br />car wash — all in one place.
            </p>
            <ul className="login-brand-features">
              <li>Find nearby washes instantly</li>
              <li>Track your driver in real time</li>
              <li>Manage vehicles &amp; bookings</li>
            </ul>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-card">
            <div className="login-card-header">
              <span className="auth-greeting"><span className="auth-greeting__dot" /> Good to see you</span>
              <h2>Welcome back</h2>
              <p>Sign in to pick up right where you left off.</p>
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
                  <div className="input-affix">
                    <span className="input-affix__icon"><MailIcon /></span>
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
                </div>
                <div className="form-field">
                  <label htmlFor="login-password">Password</label>
                  <div className="input-affix">
                    <span className="input-affix__icon"><LockIcon /></span>
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
                      className="input-affix__toggle"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                <div className="login-row">
                  <label className="login-remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="login-forgot">Forgot password?</button>
                </div>

                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowIcon />
                    </>
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
              <span>New here? <Link to="/register">Create an account</Link></span>
            </p>

            {import.meta.env.DEV && (
              <div className="login-testaccounts">
                <strong>Test accounts</strong>
                <ul>
                  {TEST_ACCOUNTS.map((a) => (
                    <li key={a.role}>
                      <span className="login-test-dot" style={{ background: a.color }} />
                      {a.role}: {a.cred}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
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
