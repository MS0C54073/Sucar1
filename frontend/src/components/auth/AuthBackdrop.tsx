/**
 * Frosted photo backdrop for the auth screens.
 *
 * Replaces the previous (token-less, error-spamming) Mapbox background with a
 * heavily blurred suka9 photo + a readable scrim — the frosted-glass aesthetic.
 * suka10 is layered faintly behind the form card itself (see AuthBackdrop.css).
 */
import './AuthBackdrop.css';

const AuthBackdrop = () => (
  <div className="auth-backdrop" aria-hidden="true">
    <div className="auth-backdrop__photo" />
    <div className="auth-backdrop__scrim" />
  </div>
);

export default AuthBackdrop;
