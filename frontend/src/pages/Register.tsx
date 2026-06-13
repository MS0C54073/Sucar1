import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageLayout from '../components/PageLayout';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import PhoneLogin from '../components/auth/PhoneLogin';
import ThemeToggle from '../components/ThemeToggle';
import AuthMapBackground from '../components/auth/AuthMapBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../components/auth/AuthMapBackground.css';
import './Register.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

type Role = 'client' | 'driver' | 'carwash';
type AuthMethod = 'email' | 'google' | 'phone';

type RegisterContentProps = {
  role: Role;
  authMethod: AuthMethod;
  loading: boolean;
  error: string;
  formData: Record<string, string | boolean>;
  onChangeRole: (r: Role) => void;
  onChangeAuthMethod: (m: AuthMethod) => void;
  onChangeField: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onChildError: (msg: string) => void;
  googleClientId: string;
  emailError: string;
};

const RegisterContent = memo(({
  role,
  authMethod,
  loading,
  error,
  formData,
  onChangeRole,
  onChangeAuthMethod,
  onChangeField,
  onSubmit,
  onChildError,
  googleClientId,
  emailError,
}: RegisterContentProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-screen">
      <div className="register-page">
      <aside className="register-brand">
        <div className="register-brand-inner">
          <img src="/images/Sucarcar.jpeg" alt="" className="register-brand-logo" />
          <h1 className="register-brand-title">SuCAR</h1>
          <p className="register-brand-tagline">Join thousands getting their cars washed on demand.</p>
        </div>
      </aside>

      <div className="register-panel">
        <div className="register-shell">
          <div className="register-shell-top">
            <Link to="/" className="register-back">
              ← Home
            </Link>
            <ThemeToggle />
          </div>

          <div className="register-card">
          <div className="register-card-header">
            <h2>Create account</h2>
            <p>Quick setup — only what we need for your role</p>
          </div>

          <div className="segmented-control register-tabs">
            <button
              type="button"
              className={role === 'client' ? 'active' : ''}
              onClick={() => onChangeRole('client')}
            >
              Client
            </button>
            <button
              type="button"
              className={role === 'driver' ? 'active' : ''}
              onClick={() => onChangeRole('driver')}
            >
              Driver
            </button>
            <button
              type="button"
              className={role === 'carwash' ? 'active' : ''}
              onClick={() => onChangeRole('carwash')}
            >
              Car wash
            </button>
          </div>

          <div className="segmented-control register-tabs register-tabs--sm">
            <button
              type="button"
              className={authMethod === 'email' ? 'active' : ''}
              onClick={() => onChangeAuthMethod('email')}
            >
              Email
            </button>
            <button
              type="button"
              className={authMethod === 'google' ? 'active' : ''}
              onClick={() => onChangeAuthMethod('google')}
            >
              Google
            </button>
            <button
              type="button"
              className={authMethod === 'phone' ? 'active' : ''}
              onClick={() => onChangeAuthMethod('phone')}
            >
              Phone
            </button>
          </div>

          {(error || emailError) && (
            <div className="alert alert-error" role="alert">
              {error || emailError}
            </div>
          )}

          {authMethod === 'email' && (
            <form onSubmit={onSubmit} className="register-form">
              <div className="register-form-scroll">
                <div className="register-field-grid">
                  <div className="form-field">
                    <label htmlFor="reg-name">Full name</label>
                    <input
                      id="reg-name"
                      className="input input-sm"
                      name="name"
                      type="text"
                      value={String(formData.name)}
                      onChange={onChangeField}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="reg-email">Email</label>
                    <input
                      id="reg-email"
                      className="input input-sm"
                      name="email"
                      type="email"
                      value={String(formData.email)}
                      onChange={onChangeField}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="reg-password">Password</label>
                    <div className="password-field">
                      <input
                        id="reg-password"
                        className="input input-sm"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={String(formData.password)}
                        onChange={onChangeField}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-field-toggle"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="reg-phone">Phone</label>
                    <input
                      id="reg-phone"
                      className="input input-sm"
                      name="phone"
                      type="tel"
                      value={String(formData.phone)}
                      onChange={onChangeField}
                      required
                      autoComplete="tel"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="reg-nrc">NRC / ID</label>
                    <input
                      id="reg-nrc"
                      className="input input-sm"
                      name="nrc"
                      type="text"
                      value={String(formData.nrc)}
                      onChange={onChangeField}
                      required
                    />
                  </div>
                </div>

                {role === 'client' && (
                  <div className="register-role-extra">
                    <label className="register-check">
                      <input
                        name="isBusiness"
                        type="checkbox"
                        checked={!!formData.isBusiness}
                        onChange={onChangeField}
                      />
                      Business account
                    </label>
                    {formData.isBusiness && (
                      <div className="form-field">
                        <label htmlFor="reg-business">Business name</label>
                        <input
                          id="reg-business"
                          className="input input-sm"
                          name="businessName"
                          type="text"
                          value={String(formData.businessName)}
                          onChange={onChangeField}
                        />
                      </div>
                    )}
                  </div>
                )}

                {role === 'driver' && (
                  <div className="register-field-grid register-role-extra">
                    <div className="form-field">
                      <label htmlFor="reg-license">License no.</label>
                      <input
                        id="reg-license"
                        className="input input-sm"
                        name="licenseNo"
                        value={String(formData.licenseNo)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reg-license-type">License type</label>
                      <input
                        id="reg-license-type"
                        className="input input-sm"
                        name="licenseType"
                        value={String(formData.licenseType)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reg-license-exp">License expiry</label>
                      <input
                        id="reg-license-exp"
                        className="input input-sm"
                        name="licenseExpiry"
                        type="date"
                        value={String(formData.licenseExpiry)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reg-marital">Marital status</label>
                      <select
                        id="reg-marital"
                        className="input input-sm"
                        name="maritalStatus"
                        value={String(formData.maritalStatus)}
                        onChange={onChangeField}
                        required
                      >
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                      </select>
                    </div>
                    <div className="form-field form-field--full">
                      <label htmlFor="reg-address">Address</label>
                      <input
                        id="reg-address"
                        className="input input-sm"
                        name="address"
                        value={String(formData.address)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                  </div>
                )}

                {role === 'carwash' && (
                  <div className="register-field-grid register-role-extra">
                    <div className="form-field form-field--full">
                      <label htmlFor="reg-cw-name">Car wash name</label>
                      <input
                        id="reg-cw-name"
                        className="input input-sm"
                        name="carWashName"
                        value={String(formData.carWashName)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                    <div className="form-field form-field--full">
                      <label htmlFor="reg-location">Location</label>
                      <input
                        id="reg-location"
                        className="input input-sm"
                        name="location"
                        value={String(formData.location)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reg-bays">Washing bays</label>
                      <input
                        id="reg-bays"
                        className="input input-sm"
                        name="washingBays"
                        type="number"
                        min={1}
                        value={String(formData.washingBays)}
                        onChange={onChangeField}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary register-submit">
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          )}

          {authMethod === 'google' && (
            <div className="register-alt-panel">
              {googleClientId ? (
                <GoogleLoginButton role={role} onSuccess={() => {}} onError={onChildError} />
              ) : (
                <p className="register-alt-hint">Google sign-up is not configured.</p>
              )}
            </div>
          )}

          {authMethod === 'phone' && (
            <div className="register-alt-panel">
              <PhoneLogin mode="register" role={role} onSuccess={() => {}} onError={onChildError} />
            </div>
          )}

          <p className="register-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          </div>
        </div>
      </div>
      </div>
      <AuthMapBackground />
    </div>
  );
});

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('client');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    nrc: '',
    businessName: '',
    isBusiness: false,
    licenseNo: '',
    licenseType: '',
    licenseExpiry: '',
    address: '',
    maritalStatus: '',
    carWashName: '',
    location: '',
    washingBays: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setEmailError('');
    const t = setTimeout(() => {
      const email = String(formData.email).trim();
      if (!email) return;
      if (!/.+@.+\..+/.test(email)) setEmailError('Enter a valid email');
    }, 250);
    return () => clearTimeout(t);
  }, [formData.email]);

  const onChangeField = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target as HTMLInputElement;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        nrc: formData.nrc,
        role,
      };

      if (role === 'client') {
        payload.businessName = formData.businessName;
        payload.isBusiness = formData.isBusiness;
      } else if (role === 'driver') {
        Object.assign(payload, {
          licenseNo: formData.licenseNo,
          licenseType: formData.licenseType,
          licenseExpiry: formData.licenseExpiry,
          address: formData.address,
          maritalStatus: formData.maritalStatus,
        });
      } else if (role === 'carwash') {
        Object.assign(payload, {
          carWashName: formData.carWashName,
          location: formData.location,
          washingBays: parseInt(String(formData.washingBays)) || 0,
        });
      }

      const response = await axios.post(`${API_URL}/auth/register`, payload);
      if (response.data.success) {
        navigate('/login');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <RegisterContent
      role={role}
      authMethod={authMethod}
      loading={loading}
      error={error}
      formData={formData}
      onChangeRole={setRole}
      onChangeAuthMethod={setAuthMethod}
      onChangeField={onChangeField}
      onSubmit={handleSubmit}
      onChildError={setError}
      googleClientId={GOOGLE_CLIENT_ID}
      emailError={emailError}
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

export default Register;
