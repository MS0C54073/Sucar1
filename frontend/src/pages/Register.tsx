import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageLayout from '../components/PageLayout';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import PhoneLogin from '../components/auth/PhoneLogin';
import DownloadAppSection from '../components/DownloadAppSection';
import BackgroundCars from '../components/animations/BackgroundCars';
import FloatingElements from '../components/animations/FloatingElements';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './Register.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type Role = 'client' | 'driver' | 'carwash';
type AuthMethod = 'email' | 'google' | 'phone';

type RegisterContentProps = {
  role: Role;
  authMethod: AuthMethod;
  loading: boolean;
  error: string;
  formData: any;
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
  return (
    <div className="register-container">
      <BackgroundCars count={5} speed="slow" />
      <FloatingElements type="sparkles" count={10} intensity="low" />
      <FloatingElements type="bubbles" count={7} intensity="low" />
      <FloatingElements type="cars" count={4} intensity="low" />
      <div className="register-box">
        <h1>Register - SuCAR</h1>
        
        {/* Role Selector */}
        <div className="role-selector">
          <button
            className={role === 'client' ? 'active' : ''}
            onClick={() => onChangeRole('client')}
          >
            Client
          </button>
          <button
            className={role === 'driver' ? 'active' : ''}
            onClick={() => onChangeRole('driver')}
          >
            Driver
          </button>
          <button
            className={role === 'carwash' ? 'active' : ''}
            onClick={() => onChangeRole('carwash')}
          >
            Car Wash
          </button>
        </div>

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

        {/* Email/Password Registration */}
        {authMethod === 'email' && (
          <form onSubmit={onSubmit}>
          <div style={{ minHeight: 24 }} aria-live="polite" aria-atomic="true">
            {error && <div className="error-message">{error}</div>}
            {!error && emailError && <div className="error-message">{emailError}</div>}
          </div>

          <div className="form-group">
            <label>Name *</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={onChangeField}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={onChangeField}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={onChangeField}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone *</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={onChangeField}
              required
            />
          </div>

          <div className="form-group">
            <label>NRC *</label>
            <input
              name="nrc"
              type="text"
              value={formData.nrc}
              onChange={onChangeField}
              required
            />
          </div>

          {role === 'client' && (
            <>
              <div className="form-group">
                <label>
                  <input
                    name="isBusiness"
                    type="checkbox"
                    checked={formData.isBusiness}
                    onChange={onChangeField}
                  />
                  Business Account
                </label>
              </div>
              {formData.isBusiness && (
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={onChangeField}
                  />
                </div>
              )}
            </>
          )}

          {role === 'driver' && (
            <>
              <div className="form-group">
                <label>License Number *</label>
                <input
                  name="licenseNo"
                  type="text"
                  value={formData.licenseNo}
                  onChange={onChangeField}
                  required
                />
              </div>
              <div className="form-group">
                <label>License Type *</label>
                <input
                  name="licenseType"
                  type="text"
                  value={formData.licenseType}
                  onChange={onChangeField}
                  required
                />
              </div>
              <div className="form-group">
                <label>License Expiry *</label>
                <input
                  name="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={onChangeField}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={onChangeField}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marital Status *</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={onChangeField}
                  required
                >
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
            </>
          )}

          {role === 'carwash' && (
            <>
              <div className="form-group">
                <label>Car Wash Name *</label>
                <input
                  name="carWashName"
                  type="text"
                  value={formData.carWashName}
                  onChange={onChangeField}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={onChangeField}
                  required
                />
              </div>
              <div className="form-group">
                <label>Washing Bays *</label>
                <input
                  name="washingBays"
                  type="number"
                  value={formData.washingBays}
                  onChange={onChangeField}
                  required
                  min="1"
                />
              </div>
            </>
          )}

            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        {/* Google Registration */}
        {authMethod === 'google' && (
          <div className="google-login-section">
            {googleClientId ? (
              <GoogleLoginButton
                role={role}
                onSuccess={() => {}}
                onError={(err) => onChildError(err)}
              />
            ) : (
              <div className="error-message">
                Google registration is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
              </div>
            )}
          </div>
        )}

        {/* Phone Registration */}
        {authMethod === 'phone' && (
          <PhoneLogin
            mode="register"
            role={role}
            onSuccess={() => {}}
            onError={(err) => onChildError(err)}
          />
        )}

        <p className="register-note">
          Already have an account? <a href="/login">Login</a>
        </p>

        {/* Download App Section */}
        <div className="register-download-section">
          <DownloadAppSection variant="compact" />
        </div>
      </div>
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

  // Debounce email validation
  useEffect(() => {
    setEmailError('');
    const t = setTimeout(() => {
      const email = formData.email.trim();
      if (!email) return;
      const ok = /.+@.+\..+/.test(email);
      if (!ok) setEmailError('Please enter a valid email address');
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
      const payload: any = {
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
        payload.licenseNo = formData.licenseNo;
        payload.licenseType = formData.licenseType;
        payload.licenseExpiry = formData.licenseExpiry;
        payload.address = formData.address;
        payload.maritalStatus = formData.maritalStatus;
      } else if (role === 'carwash') {
        payload.carWashName = formData.carWashName;
        payload.location = formData.location;
        payload.washingBays = parseInt(formData.washingBays) || 0;
      }

      const response = await axios.post(`${API_URL}/auth/register`, payload);
      if (response.data.success) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.errors?.[0]?.msg 
        || err.message 
        || 'Registration failed. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <PageLayout>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
        </GoogleOAuthProvider>
      ) : (
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
      )}
    </PageLayout>
  );
};

export default Register;
