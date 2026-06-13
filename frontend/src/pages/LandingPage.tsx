import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import DownloadAppSection from '../components/DownloadAppSection';
import BackgroundCars from '../components/animations/BackgroundCars';
import EnhancedCarWashScene from '../components/animations/EnhancedCarWashScene';
import CarQueueSystem from '../components/animations/CarQueueSystem';
import FloatingElements from '../components/animations/FloatingElements';
import { AnimatedCard } from '../components/animations/CardAnimations';
import Icon from '../components/icons/Icon';
import CtaButton from '../components/CtaButton';
import './LandingPage.css';
// Design system (su-* classes) is imported globally in main.tsx.

function dashboardPath(role: string): string {
  if (role === 'admin' || role === 'subadmin') return '/admin';
  if (role === 'carwash') return '/carwash';
  if (role === 'driver') return '/driver';
  return '/client';
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return (
    <PageLayout>
      <div className="landing-page">
        {/* Hero Section */}
        <section className="hero-section">
          <BackgroundCars count={6} speed="normal" />
          <FloatingElements type="cars" count={4} intensity="low" />
          <div className="hero-image-container">
            <img 
              src="/images/Sucarcar.jpeg"
              alt="SuCar - Professional Car Wash Services"
              className="hero-image"
            />
          </div>
          <div className="hero-content">
            <span className="su-pill">
              <Icon name="sparkles" size={14} /> Drive-in &amp; doorstep pickup
            </span>
            <h1 className="hero-headline">
              Professional Car Wash Services, Delivered to Your Doorstep
            </h1>
            <p className="hero-subheading">
              Experience unmatched convenience. Book your car wash, track every step in real time,
              and receive your freshly cleaned vehicle delivered right to your door. All from the comfort of your home or office.
            </p>
            <div className="hero-cta">
              <CtaButton onClick={() => navigate('/book')}>Book Your First Wash</CtaButton>
              <CtaButton variant="ghost" icon="user" iconRight={false} onClick={() => navigate('/login')}>
                Sign In
              </CtaButton>
            </div>
          </div>
        </section>

      {/* Key Features */}
      <section className="features-section">
        <BackgroundCars count={5} speed="slow" />
        <FloatingElements type="bubbles" count={8} intensity="low" />
        <div className="section-container">
          <h2 className="section-title">Why Choose SuCAR?</h2>
          <div className="features-grid">
            <AnimatedCard variant="fade" delay={0.1}>
              <div className="feature-card">
                <div className="feature-icon su-badge su-badge--cyan"><Icon name="mapPin" /></div>
                <h3>Real-Time Tracking</h3>
                <p>
                  Watch your vehicle's journey from pickup to delivery with live GPS tracking. 
                  Know exactly where your car is at every step.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="fade" delay={0.2}>
              <div className="feature-card">
                <div className="feature-icon su-badge su-badge--queue"><Icon name="timer" /></div>
                <h3>On-Demand Service</h3>
                <p>
                  Book a car wash whenever you need it. Schedule pickups at your convenience, 
                  whether it's today or next week.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="fade" delay={0.3}>
              <div className="feature-card">
                <div className="feature-icon su-badge su-badge--detail"><Icon name="shieldCheck" /></div>
                <h3>Professional Quality</h3>
                <p>
                  Trusted car wash partners with proven track records. Your vehicle is in expert hands 
                  from start to finish.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="fade" delay={0.4}>
              <div className="feature-card">
                <div className="feature-icon su-badge su-badge--pickup"><Icon name="creditCard" /></div>
                <h3>Secure Payments</h3>
                <p>
                  Pay securely after service completion. Multiple payment options available 
                  for your convenience.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="fade" delay={0.5}>
              <div className="feature-card">
                <div className="feature-icon su-badge su-badge--wash"><Icon name="car" /></div>
                <h3>Multiple Vehicles</h3>
                <p>
                  Manage all your vehicles in one place. Book services for your entire fleet 
                  with ease.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="fade" delay={0.6}>
              <div className="feature-card">
                <div className="feature-icon su-badge su-badge--rate"><Icon name="smartphone" /></div>
                <h3>Mobile-First</h3>
                <p>
                  Access SuCAR from any device. Our responsive design works seamlessly 
                  on phones, tablets, and desktops.
                </p>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="what-we-do-section">
        <EnhancedCarWashScene intensity="high" stationCount={4} />
        <CarQueueSystem stationCount={3} queueLength={2} />
        <BackgroundCars count={5} speed="normal" />
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <div className="process-steps">
            <AnimatedCard variant="scale" delay={0.1}>
              <div className="process-step">
                <div className="step-number">1</div>
                <h3>Book Your Service</h3>
                <p>
                  Choose a car wash provider, select your service type, and schedule a pickup time 
                  that works for you.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="scale" delay={0.2}>
              <div className="process-step">
                <div className="step-number">2</div>
                <h3>Driver Pickup</h3>
                <p>
                  A verified driver arrives at your location, picks up your vehicle, 
                  and transports it to the car wash facility.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="scale" delay={0.3}>
              <div className="process-step">
                <div className="step-number">3</div>
                <h3>Professional Wash</h3>
                <p>
                  Your vehicle receives a thorough, professional cleaning at our partner facility. 
                  Track progress in real-time.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="scale" delay={0.4}>
              <div className="process-step">
                <div className="step-number">4</div>
                <h3>Delivery & Payment</h3>
                <p>
                  Your clean vehicle is delivered back to you. Complete payment securely 
                  and rate your experience.
                </p>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <FloatingElements type="bubbles" count={6} intensity="low" />
        <BackgroundCars count={2} speed="slow" />
        <div className="section-container">
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-grid">
            <AnimatedCard variant="slide" delay={0.1}>
              <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "SuCAR has completely transformed how I maintain my vehicles. The convenience 
                  of having my car picked up, washed, and delivered is unmatched. Highly recommended!"
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar su-avatar"><Icon name="user" size={22} /></div>
                <div className="author-info">
                  <div className="author-name">John Mwansa</div>
                  <div className="author-role">Business Owner</div>
                </div>
              </div>
            </div>
            </AnimatedCard>
            <AnimatedCard variant="slide" delay={0.2}>
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p className="testimonial-text">
                    "The real-time tracking feature gives me peace of mind. I always know where my 
                    vehicle is, and the service quality has been consistently excellent."
                  </p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar su-avatar"><Icon name="user" size={22} /></div>
                  <div className="author-info">
                    <div className="author-name">Sarah Banda</div>
                    <div className="author-role">Professional</div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard variant="slide" delay={0.3}>
              <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "As someone who manages multiple vehicles, SuCAR has been a game-changer. 
                  The platform is intuitive, and the service is reliable every single time."
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar su-avatar"><Icon name="user" size={22} /></div>
                <div className="author-info">
                  <div className="author-name">David Phiri</div>
                  <div className="author-role">Fleet Manager</div>
                </div>
              </div>
            </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <BackgroundCars count={5} speed="normal" />
        <FloatingElements type="sparkles" count={12} intensity="medium" />
        <FloatingElements type="cars" count={3} intensity="low" />
        <div className="section-container">
          <h2 className="cta-title">Ready to Experience Convenience?</h2>
          <p className="cta-description">
            Join thousands of satisfied customers who trust SuCAR for their vehicle care needs.
          </p>
          <div className="cta-buttons">
            <CtaButton onClick={() => navigate('/book')}>Get Started Today</CtaButton>
            <CtaButton variant="ghost" icon="user" iconRight={false} onClick={() => navigate('/login')}>
              Sign In
            </CtaButton>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <div className="download-app-wrapper">
        <BackgroundCars count={3} speed="slow" />
        <FloatingElements type="cars" count={6} intensity="low" />
        <FloatingElements type="sparkles" count={5} intensity="low" />
        <DownloadAppSection />
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <BackgroundCars count={4} speed="slow" />
        <FloatingElements type="bubbles" count={6} intensity="low" />
        <div className="section-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>SuCAR</h3>
              <p>Professional car wash services, delivered to your doorstep.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Services</h4>
                <ul>
                  <li>Car Wash</li>
                  <li>Interior Cleaning</li>
                  <li>Exterior Wash</li>
                  <li>Full Service</li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li>About Us</li>
                  <li>How It Works</li>
                  <li>Contact</li>
                  <li>Support</li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Location</h4>
                <p>Lusaka, Zambia</p>
                <p>Serving the greater Lusaka area</p>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SuCAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </PageLayout>
  );
};

export default LandingPage;
