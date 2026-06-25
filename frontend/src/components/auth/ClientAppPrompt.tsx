/**
 * Client registration interstitial.
 *
 * Per the A1 architecture, the client experience lives in the SuCAR mobile app
 * (clients + drivers are mobile-only). Rather than completing client sign-up on
 * web, we present an app-download prompt. Driver / car-wash partners still
 * register on web.
 *
 * Product notes (see PR description): this is a *soft* interception, not a hard
 * redirect — the marketing/landing pages stay crawlable, and we keep graceful
 * fallbacks (a contact route for users without a smartphone, plus a path to the
 * partner sign-up forms) so we don't dead-end pre-launch traffic.
 */
import { Link } from 'react-router-dom';
import Icon from '../icons/Icon';
import StoreBadges from '../landing/StoreBadges';
import './ClientAppPrompt.css';

interface ClientAppPromptProps {
  /** Switch the register form to a web-eligible role. */
  onChooseRole: (role: 'driver' | 'carwash') => void;
}

const ClientAppPrompt = ({ onChooseRole }: ClientAppPromptProps) => (
  <div className="client-app-prompt">
    <div className="cap-badge">
      <Icon name="smartphone" size={30} />
    </div>

    <span className="cap-soon">
      <span className="cap-soon__dot" /> Client app launching soon
    </span>

    <h3 className="cap-title">Clients ride along in the app</h3>
    <p className="cap-text">
      Booking, live tracking, and payments all live in the SuCAR mobile app, built for
      the way you follow your wash from pickup to doorstep. Web sign-up is reserved for
      drivers and car-wash partners.
    </p>

    <StoreBadges />

    <div className="cap-fallback">
      <Icon name="helpCircle" size={16} />
      <span>
        No smartphone?{' '}
        <a href="mailto:hello@sucar.app?subject=Help%20me%20get%20started%20with%20SuCAR">
          Email us
        </a>{' '}
        and we will help you book your first wash.
      </span>
    </div>

    <div className="cap-divider"><span>Registering a business or partner?</span></div>

    <div className="cap-roles">
      <button type="button" className="cap-role" onClick={() => onChooseRole('driver')}>
        <Icon name="route" size={18} />
        <span>
          <strong>I am a driver</strong>
          <small>Pick up and deliver vehicles</small>
        </span>
        <Icon name="chevronRight" size={18} />
      </button>
      <button type="button" className="cap-role" onClick={() => onChooseRole('carwash')}>
        <Icon name="droplets" size={18} />
        <span>
          <strong>I run a car wash</strong>
          <small>List a wash bay and take bookings</small>
        </span>
        <Icon name="chevronRight" size={18} />
      </button>
    </div>

    <p className="cap-signin">
      Already registered in the app? <Link to="/login">Sign in</Link>
    </p>
  </div>
);

export default ClientAppPrompt;
