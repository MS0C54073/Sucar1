/**
 * Crafted SuCAR app mockup — a live wash booking with map, driver card, and a
 * progress tracker. Pure CSS/SVG (no images), themable via --lp-* tokens where
 * relevant. Used in the Get-the-app section.
 */
import Icon from '../icons/Icon';

const PhoneMockup = () => (
  <div className="lp-phone" role="img" aria-label="SuCAR app showing a live wash booking">
    <div className="lp-phone__notch" />
    <div className="lp-phone__screen">
      <div className="lp-app__bar">
        <span>9:41</span>
        <span className="lp-app__bars" />
      </div>
      <div className="lp-app__head">
        <div>
          <p className="lp-app__hello">Good morning, Alex</p>
          <p className="lp-app__title">Your wash is on the way</p>
        </div>
        <span className="lp-app__live">LIVE</span>
      </div>

      <div className="lp-app__map">
        <svg viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true">
          <path className="lp-route" d="M20 120 C 80 120, 90 40, 150 50 S 250 40, 280 30" />
        </svg>
        <span className="lp-pin lp-pin--start"><Icon name="mapPin" size={14} /></span>
        <span className="lp-pin lp-pin--car"><Icon name="car" size={14} /></span>
      </div>

      <div className="lp-app__driver">
        <span className="lp-app__avatar"><Icon name="user" size={18} /></span>
        <div className="lp-app__driver-info">
          <p className="lp-app__driver-name">Daniel · Driver</p>
          <p className="lp-app__driver-meta">
            <Icon name="star" size={12} /> 4.9 · Toyota pickup
          </p>
        </div>
        <span className="lp-app__eta">4 min</span>
      </div>

      <div className="lp-app__progress">
        {['Booked', 'Pickup', 'Wash', 'Deliver'].map((s, i) => (
          <div key={s} className={`lp-step ${i <= 2 ? 'done' : ''} ${i === 2 ? 'active' : ''}`}>
            <span className="lp-step__dot">{i < 2 ? <Icon name="check" size={11} /> : null}</span>
            <span className="lp-step__label">{s}</span>
          </div>
        ))}
      </div>

      <button className="lp-app__cta" tabIndex={-1}>
        Premium Wash · K180 <Icon name="arrowRight" size={16} />
      </button>
    </div>
  </div>
);

export default PhoneMockup;
