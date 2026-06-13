import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HomeHero.css';

const HomeHero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="home-hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Your Time is Valuable.
          <br />
          Your Car is, Too.
        </h1>
        <p className="hero-subtitle">
          Never waste time at a car wash again. Book a pickup, track your vehicle, and get it back
          clean—all from your phone.
        </p>
        <div className="hero-actions">
          {user ? (
            <>
              {user.role === 'client' && (
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/client/book')}>
                  Book Your First Wash
                </button>
              )}
              {user.role === 'driver' && (
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/driver')}>
                  View Bookings
                </button>
              )}
              {user.role === 'carwash' && (
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/carwash')}>
                  Manage Services
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/book')}>
                Book Your First Wash
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </>
          )}
        </div>
        {!user && (
          <button className="btn btn-text learn-more" onClick={() => navigate('/#features')}>
            Learn More →
          </button>
        )}
      </div>
      <div className="hero-visual">
        <div className="hero-illustration">🚗✨</div>
      </div>
    </section>
  );
};

export default HomeHero;
