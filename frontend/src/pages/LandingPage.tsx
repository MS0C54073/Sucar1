import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon, { type IconName } from '../components/icons/Icon';
import CtaButton from '../components/CtaButton';
import Reveal from '../components/landing/Reveal';
import Counter from '../components/landing/Counter';
import ThemeToggle from '../components/landing/ThemeToggle';
import StoreBadges from '../components/landing/StoreBadges';
import './LandingPage.css';

/** Premium branded photos for the showcase marquee. */
const SHOWCASE = [
  { src: '/images/suka9.png', alt: 'A McLaren at a SuCAR luxe wash centre with attendants' },
  { src: '/images/suka7.png', alt: 'A detailed sports car at a SuCAR wash centre' },
  { src: '/images/suka8.png', alt: 'A SuCAR driver washing a car at a customer doorstep' },
  { src: '/images/suka6.png', alt: 'A SuCAR specialist detailing a wheel' },
  { src: '/images/suka10.png', alt: 'SuCAR advanced and protective car care stages' },
];

function dashboardPath(role: string): string {
  if (role === 'admin' || role === 'subadmin') return '/admin';
  if (role === 'carwash') return '/carwash';
  if (role === 'driver') return '/driver';
  return '/client';
}

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'For drivers', href: '#drivers' },
  { label: 'Reviews', href: '#reviews' },
];

type Persona = 'Daily drivers' | 'Busy parents' | 'Fleets' | 'Dealerships';

const PERSONA_COPY: Record<Persona, { line: string; stat: string; statLabel: string }> = {
  'Daily drivers': {
    line: 'Book on your commute, get the keys back washed before lunch — no detour, no waiting line.',
    stat: '12 min',
    statLabel: 'Avg. pickup time',
  },
  'Busy parents': {
    line: 'Schedule a doorstep pickup between school runs. We collect, wash, and return — you never leave home.',
    stat: '0 trips',
    statLabel: 'To the wash bay',
  },
  Fleets: {
    line: 'Keep every vehicle road ready. Batch book the whole fleet and track each wash from one dashboard.',
    stat: '40+ cars',
    statLabel: 'Per booking batch',
  },
  Dealerships: {
    line: 'Showroom fresh inventory on demand. Verified operators, photo proof, and consistent finish every time.',
    stat: '98%',
    statLabel: 'Finish consistency',
  },
};

const FEATURES: { icon: IconName; badge: string; title: string; body: string }[] = [
  {
    icon: 'mapPin',
    badge: 'su-badge--cyan',
    title: 'Live tracking',
    body: 'Follow your car from pickup to delivery with live GPS. Know exactly where it is, every minute.',
  },
  {
    icon: 'truck',
    badge: 'su-badge--pickup',
    title: 'Doorstep pickup',
    body: 'A verified driver collects your vehicle from home or the office and brings it back spotless.',
  },
  {
    icon: 'timer',
    badge: 'su-badge--queue',
    title: 'Queue and ETA',
    body: 'See the wash bay queue and an honest ETA before you book. No guessing, no idle waiting.',
  },
  {
    icon: 'shieldCheck',
    badge: 'su-badge--detail',
    title: 'Vetted operators',
    body: 'Every wash partner is fully vetted and rated, so your car is always in expert hands.',
  },
  {
    icon: 'star',
    badge: 'su-badge--rate',
    title: 'Rate every wash',
    body: 'Score the finish and the driver. Ratings keep quality high and surface the best operators near you.',
  },
  {
    icon: 'creditCard',
    badge: 'su-badge--wash',
    title: 'Pay after service',
    body: 'Confirm the result, then pay securely in the app. Cards, mobile money, and wallets all supported.',
  },
];

const STEPS = [
  { n: '01', icon: 'smartphone' as IconName, title: 'Book in seconds', body: 'Pick a service, choose a time, and set your pickup spot.' },
  { n: '02', icon: 'route' as IconName, title: 'Driver collects', body: 'A verified driver arrives and takes your car to the bay.' },
  { n: '03', icon: 'droplets' as IconName, title: 'Pro wash', body: 'Your car gets a thorough, tracked clean by a rated operator.' },
  { n: '04', icon: 'check' as IconName, title: 'Delivered back', body: 'Spotless and returned to your door. Pay and rate in the app.' },
];

const REVIEWS = [
  {
    text: 'I book on my way into work and the car is back, spotless, before my first meeting. The tracking is genuinely useful — I always know where it is.',
    name: 'John Mwansa',
    role: 'Business owner',
  },
  {
    text: 'The doorstep pickup changed everything. Two kids, no time for a wash queue — SuCAR just collects it and brings it back clean.',
    name: 'Sarah Banda',
    role: 'Parent of two',
  },
  {
    text: 'Managing a fleet used to mean a dozen phone calls. Now it is one batch booking and a single dashboard. Consistent finish every time.',
    name: 'David Phiri',
    role: 'Fleet manager',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [persona, setPersona] = useState<Persona>('Daily drivers');

  if (user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  const personaData = PERSONA_COPY[persona];

  return (
    <div className="lp">
      {/* ---------------- Nav ---------------- */}
      <header className="lp-nav-wrap">
        <nav className="lp-nav" aria-label="Primary">
          <a className="lp-brand" href="#top" aria-label="SuCAR home">
            <img src="/images/Sucarcar.jpeg" alt="" className="lp-brand__mark" />
            <span className="lp-brand__name">SuCAR</span>
          </a>
          <span className="lp-soon"><span className="lp-soon__dot" /> Coming soon</span>

          <div className={`lp-nav__links ${menuOpen ? 'is-open' : ''}`}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="lp-nav__cta-mobile">
              <CtaButton variant="ghost" icon="user" iconRight={false} onClick={() => navigate('/login')}>
                Sign in
              </CtaButton>
              <CtaButton onClick={() => navigate('/register')}>Get started</CtaButton>
            </div>
          </div>

          <div className="lp-nav__actions">
            <ThemeToggle />
            <button className="lp-nav__signin" onClick={() => navigate('/login')}>
              Sign in
            </button>
            <CtaButton onClick={() => navigate('/register')}>Get started</CtaButton>
            <button
              className="lp-nav__burger"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
            </button>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* ---------------- Hero ---------------- */}
        <section className="lp-hero">
          <div className="lp-hero__glow" aria-hidden="true" />
          <div className="lp-container lp-hero__inner">
            <Reveal as="span" className="su-pill lp-hero__pill">
              <Icon name="sparkles" size={14} /> Drive in &amp; doorstep pickup
            </Reveal>
            <Reveal as="h1" delay={1} className="lp-hero__title">
              The cleanest way to <span className="lp-grad">wash your car</span>
            </Reveal>
            <Reveal as="p" delay={2} className="lp-hero__sub">
              Book a professional wash, watch a verified driver pick your car up, and get it
              delivered back spotless — tracked in real time, from anywhere.
            </Reveal>
            <Reveal delay={3} className="lp-hero__cta">
              <CtaButton onClick={() => navigate('/register')}>Book your first wash</CtaButton>
              <CtaButton variant="ghost" icon="play" iconRight={false} onClick={() => navigate('/login')}>
                Watch demo
              </CtaButton>
            </Reveal>

            {/* Hero media — the SuCAR wash-process showcase */}
            <Reveal delay={4} className="lp-hero__media">
              <img
                className="lp-hero__photo"
                src="/images/suka2.png"
                alt="The SuCAR wash process: vehicle reception, automated foam & wash, rinse & polish, and final detail & inspection"
                loading="eager"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </Reveal>
          </div>
        </section>

        {/* ---------------- Trust strip ---------------- */}
        <section className="lp-trust">
          <div className="lp-container lp-trust__inner">
            <div className="lp-trust__rating">
              <span className="lp-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={16} />
                ))}
              </span>
              <span>
                <strong>4.9</strong> from 2,500+ washes
              </span>
            </div>
            <div className="lp-trust__marquee">
              <div className="lp-trust__track">
                {[...'Clients Drivers Operators Fleets Dealerships Commuters'.split(' '), ...'Clients Drivers Operators Fleets Dealerships Commuters'.split(' ')].map(
                  (t, i) => (
                    <span key={i} className="lp-trust__chip">#{t}</span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="lp-section" id="how">
          <div className="lp-container">
            <Reveal as="p" className="lp-eyebrow">How it works</Reveal>
            <Reveal as="h2" delay={1} className="lp-h2">
              Four steps from booking to a spotless car
            </Reveal>
            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i} className="lp-step-card">
                  <div className="lp-step-card__top">
                    <span className="lp-step-card__icon"><Icon name={s.icon} size={22} /></span>
                    <span className="lp-step-card__n">{s.n}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section className="lp-section lp-section--tint" id="features">
          <div className="lp-container">
            <Reveal as="p" className="lp-eyebrow">Why SuCAR</Reveal>
            <Reveal as="h2" delay={1} className="lp-h2">
              Everything you need for an effortless wash
            </Reveal>
            <div className="lp-features">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i % 3} className="lp-feature">
                  <div className={`su-badge ${f.badge}`}><Icon name={f.icon} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Use cases ---------------- */}
        <section className="lp-section" id="drivers">
          <div className="lp-container">
            <Reveal as="p" className="lp-eyebrow">Made for the way you drive</Reveal>
            <Reveal as="h2" delay={1} className="lp-h2">
              One platform, every kind of driver
            </Reveal>
            <Reveal delay={2} className="lp-seg" role="tablist" aria-label="Use cases">
              {(Object.keys(PERSONA_COPY) as Persona[]).map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={persona === p}
                  className={`lp-seg__btn ${persona === p ? 'is-active' : ''}`}
                  onClick={() => setPersona(p)}
                >
                  {p}
                </button>
              ))}
            </Reveal>
            <Reveal delay={3} className="lp-usecard">
              <div className="lp-usecard__body">
                <p className="lp-usecard__line">{personaData.line}</p>
                <CtaButton variant="ghost" onClick={() => navigate('/register')}>
                  Get a quote
                </CtaButton>
              </div>
              <div className="lp-usecard__stat">
                <span className="lp-usecard__num">{personaData.stat}</span>
                <span className="lp-usecard__label">{personaData.statLabel}</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------- Metrics (dark band) ---------------- */}
        <section className="lp-metrics">
          <div className="lp-container lp-metrics__inner">
            <Reveal className="lp-metric">
              <span className="lp-metric__num"><Counter value={62000} suffix="+" /></span>
              <span className="lp-metric__label">Washes booked</span>
            </Reveal>
            <Reveal delay={1} className="lp-metric">
              <span className="lp-metric__num"><Counter value={98} suffix="%" /></span>
              <span className="lp-metric__label">On time delivery</span>
            </Reveal>
            <Reveal delay={2} className="lp-metric">
              <span className="lp-metric__num"><Counter value={340} suffix="+" /></span>
              <span className="lp-metric__label">Verified drivers</span>
            </Reveal>
            <Reveal delay={3} className="lp-metric">
              <span className="lp-metric__num"><Counter value={12} /> min</span>
              <span className="lp-metric__label">Avg. pickup</span>
            </Reveal>
          </div>
        </section>

        {/* ---------------- Reviews ---------------- */}
        <section className="lp-section" id="reviews">
          <div className="lp-container">
            <Reveal as="p" className="lp-eyebrow">Loved by drivers</Reveal>
            <Reveal as="h2" delay={1} className="lp-h2">
              People don&apos;t go back to the wash queue
            </Reveal>
            <div className="lp-reviews">
              {REVIEWS.map((r, i) => (
                <Reveal key={r.name} delay={i} className="lp-review">
                  <span className="lp-review__quote"><Icon name="quote" size={26} /></span>
                  <p className="lp-review__text">{r.text}</p>
                  <div className="lp-review__author">
                    <span className="su-avatar"><Icon name="user" size={20} /></span>
                    <div>
                      <p className="lp-review__name">{r.name}</p>
                      <p className="lp-review__role">{r.role}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Showcase marquee ---------------- */}
        <section className="lp-showcase">
          <div className="lp-container">
            <Reveal as="p" className="lp-eyebrow">See SuCAR in action</Reveal>
            <Reveal as="h2" delay={1} className="lp-h2">
              From a quick wash to full protective detailing
            </Reveal>
          </div>
          <div className="lp-marquee" aria-label="SuCAR photo gallery">
            <div className="lp-marquee__track">
              {[...SHOWCASE, ...SHOWCASE].map((s, i) => (
                <figure className="lp-shot" key={i} aria-hidden={i >= SHOWCASE.length}>
                  <img src={s.src} alt={i < SHOWCASE.length ? s.alt : ''} loading="lazy" />
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Download CTA ---------------- */}
        <section className="lp-section" id="get-app">
          <div className="lp-container">
            <Reveal className="lp-download">
              <div className="lp-download__glow" aria-hidden="true" />
              <div className="lp-download__body">
                <p className="lp-eyebrow lp-eyebrow--light">Get the app</p>
                <h2 className="lp-download__title">Your next wash is one tap away</h2>
                <p className="lp-download__sub">
                  Book, track, and pay from your phone. Available soon on iOS and Android.
                </p>
                <StoreBadges />
              </div>
              <div className="lp-download__art">
                <img
                  className="lp-download__img"
                  src="/images/suka5.png"
                  alt="A SuCAR attendant with the booking app beside a freshly washed car"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__grid">
          <div className="lp-footer__brand">
            <a className="lp-brand" href="#top">
              <img src="/images/Sucarcar.jpeg" alt="" className="lp-brand__mark" />
              <span className="lp-brand__name">SuCAR</span>
            </a>
            <p>Professional car wash, picked up and delivered to your doorstep.</p>
          </div>
          <div className="lp-footer__col">
            <h4>Platform</h4>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#reviews">Reviews</a>
          </div>
          <div className="lp-footer__col">
            <h4>Company</h4>
            <a href="#top">About</a>
            <button onClick={() => navigate('/login')}>Sign in</button>
            <button onClick={() => navigate('/register')}>Get started</button>
          </div>
          <div className="lp-footer__col">
            <h4>Location</h4>
            <span>Lusaka, Zambia</span>
            <span>Serving greater Lusaka</span>
          </div>
        </div>
        <div className="lp-container lp-footer__bottom">
          <span>© {new Date().getFullYear()} SuCAR. All rights reserved.</span>
          <span>Built for clients, drivers &amp; operators.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
