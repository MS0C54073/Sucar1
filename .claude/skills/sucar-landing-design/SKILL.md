---
name: sucar-landing-design
description: >
  Build polished, high-motion marketing/landing pages and app UI for SuCAR (the
  car-wash pickup & booking platform) in the style of premium Framer templates —
  soft gradients, glassmorphism, pill buttons with hover text-swap motion,
  staggered appear animations, marquee tickers, animated counters, and glowing
  icon badges. Use when asked to design/replicate a landing page, hero, web
  front-end, or mobile screen for SuCAR, or to recreate the look of a reference
  site. Enforces: real SVG icons (no emoji), the SuCAR brand system, the A1
  app/role separation, and Higgsfield for generated imagery.
---

# SuCAR Landing & UI Design System

Replicate the feel of a top-tier Framer landing page (clean ink-on-light layout,
vivid accent dots, glass cards, smooth scroll-reveal motion) **applied to
SuCAR's mission**: a car-wash pickup, delivery, and booking platform connecting
**clients, drivers, operators, admins**.

Scope this to the **`web-landing`** app (public marketing) and the **mobile**
client/driver screens per the A1 architecture. Never market operator/admin
dashboards to the public.

---

## 0. Non-negotiables

1. **Real icons, never emoji.** Use an SVG icon set (`lucide-react` for web,
   `@expo/vector-icons` / `lucide-react-native` for mobile). Emojis are banned in
   UI, buttons, and feature lists.
2. **Brand-true.** Use the tokens in §1. The reference template's pink/orange
   is replaced by SuCAR's blue/cyan; keep the multi-color accent dots only for
   *service/category* iconography.
3. **Generated imagery via Higgsfield** (§7), with car-wash-true prompts.
   Optimize and self-host outputs; never hotlink. **Never generate, redraw, or
   replace the SuCAR brand logo** — always reuse the existing SuCAR logo asset
   (`Sucarcar.jpeg` / brand SVG). Higgsfield is for photos/illustrations only.
4. **Motion is meaningful and reduced-motion-safe** (§4, §8).
5. **Stay on-mission.** Copy is about washing, pickup/delivery, drivers, queue,
   ratings — not generic "habits/wellness."

---

## 1. Design tokens

Drop into `web-landing` global CSS (`:root`). Mirror as a JS theme object for
mobile.

```css
:root {
  /* Brand — SuCAR blue/cyan (matches the car-wash app mockups) */
  --su-primary:        #1E73D8;   /* primary blue */
  --su-primary-press:  #155CB0;
  --su-cyan:           #34C6F4;   /* bright accent / water */
  --su-ink:            #0F1B2D;   /* near-black headings */
  --su-muted:          #4A5567;   /* body text */
  --su-faint:          #8A95A6;   /* captions */
  --su-surface:        #FFFFFF;
  --su-bg:             #F5F8FC;   /* page background */
  --su-line:           rgba(15,27,45,.06);

  /* Service/category accent dots (icon badges only) */
  --acc-wash:   #1E73D8;   /* exterior */
  --acc-detail: #9000FF;   /* full detail */
  --acc-pickup: #12A70A;   /* pickup/delivery */
  --acc-queue:  #FF7A00;   /* queue/express */
  --acc-rate:   #FFB100;   /* ratings */
  --acc-alert:  #FF3B30;   /* incidents */

  /* Glass + elevation */
  --glass-bg:     rgba(255,255,255,.10);
  --glass-border: rgba(255,255,255,.22);
  --shadow-card:  0 8px 20px rgba(15,27,45,.06);
  --shadow-pop:   0 10px 35px rgba(15,27,45,.12);
  --shadow-cta:   0 4px 10px rgba(30,115,216,.45), 0 10px 35px rgba(30,115,216,.35);

  /* Radii */
  --r-pill: 100px;
  --r-card: 20px;
  --r-chip: 50px;

  /* Motion */
  --ease-soft: cubic-bezier(.44, 0, .56, 1);
  --dur:       .45s;

  /* Type */
  --font-display: "Clash Display", "Stack Sans Headline", system-ui, sans-serif;
  --font-body:    "Inter", "Google Sans", system-ui, sans-serif;
}
```

**Type scale:** hero `clamp(44px, 8vw, 96px)/1.0`; section `clamp(32px,4vw,48px)/1.2`;
card title `20–24px`; body `16–18px/1.4`. Headings use `--font-display`,
balanced wrapping: `text-wrap: balance`.

---

## 2. Page recipe (landing)

Order, top → bottom, each a full-width `<section>` with a centered `max-width:1260px`
container and `padding: 0 30px`:

1. **Sticky nav** — pill container, blurred bg on scroll, logo (`Sucarcar`),
   anchor links (How it works · For Drivers · Operators · Pricing), App Store /
   Play badges.
2. **Hero** — dark ink panel with a full-bleed car-wash photo + dark overlay and
   a **bottom blur fade** into the page bg. Tagline pill ("New · Drive-in & pickup"),
   big display headline, subcopy, primary CTA + ghost "Watch demo". Floating
   app-screenshot cards (3, staggered translateY, parallax on scroll).
3. **Trust strip** — "#Clients #Drivers #Operators" pill row + rating.
4. **How it works** — 2×2 / 5-col feature grid mixing light + dark glass cards
   (Book a wash · Pickup & delivery · Real-time queue · Ratings) with glow icon
   badges and inline marquee tickers of status chips.
5. **Use cases** — segmented control (Daily commuters / Fleets / Dealerships /
   Busy parents) over a dark image card with a `87%` stat.
6. **Metrics** — avatar stack `+N`, then a horizontal **video/photo marquee** of
   washes.
7. **Counter** — big animated number ("60,000+ washes booked"), looping cloud
   parallax, animated `%`/`+` counters.
8. **Smart assist** — phone mockup + AI-suggestion cards (best pickup time,
   nearest operator, dynamic ETA).
9. **Reviews** — masonry of testimonial cards + a video slideshow.
10. **FAQ** — accordion (left intro + CTA, right list).
11. **Download CTA** — phone render center, QR + store buttons, cloud parallax.
12. **Footer** — newsletter form, link columns, socials (real icons).

---

## 3. Gradient & surface recipes

These are what make it look "Framer-grade." Reuse verbatim.

```css
/* Glass card (dark sections) */
.su-glass {
  background: linear-gradient(180deg, rgba(15,27,45,.30) 0%, rgba(15,27,45,.50) 100%);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
  border-radius: var(--r-card);
  box-shadow: 0 10px 20px rgba(15,27,45,.30);
}

/* Hero image overlay → readable text + fade into bg */
.su-hero-overlay { background: linear-gradient(180deg, var(--su-ink) 0%, transparent 45%); }
.su-hero-fade  {                                  /* bottom blur fade strip */
  position:absolute; inset:auto 0 0 0; height:120px;
  background: var(--su-bg); filter: blur(25px);
}

/* Card-on-image top scrim */
.su-scrim { background: linear-gradient(180deg, var(--su-ink) 0%, transparent 50%); }

/* Glow icon badge — colored circle + matching soft shadow */
.su-badge {
  width:50px; height:50px; border-radius:50%;
  display:grid; place-items:center;
  background: var(--acc-pickup);
  box-shadow: 0 10px 15px color-mix(in srgb, var(--acc-pickup) 50%, transparent);
}

/* Accent number with glow */
.su-stat { color: var(--su-primary); text-shadow: 0 10px 15px rgba(30,115,216,.5); }

/* Marquee edge fades */
.su-fade-x::before, .su-fade-x::after { content:""; position:absolute; top:0; bottom:0; width:120px; z-index:2; pointer-events:none; }
.su-fade-x::before { left:0;  background: linear-gradient(90deg,  var(--su-bg), transparent); }
.su-fade-x::after  { right:0; background: linear-gradient(270deg, var(--su-bg), transparent); }
```

Tag chips: `background: var(--su-bg); border:1px solid var(--su-line);
border-radius: var(--r-chip); padding:8px 18px;`.

---

## 4. Motion system

Use **Framer Motion** (`motion`) on the web app. Principles: enter with
`opacity .001 → 1` + `y: 20 → 0`, spring `{ bounce: 0 }`, **stagger 0.1s**;
hover/press use the `--ease-soft` .45s easing.

```tsx
// reveal.tsx — scroll-reveal with stagger
import { motion } from "framer-motion";

const reveal = {
  hidden: { opacity: 0.001, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", bounce: 0, duration: 0.6, delay: i * 0.1 },
  }),
};

export const Reveal = ({ i = 0, children, ...p }: any) => (
  <motion.div variants={reveal} initial="hidden" whileInView="show"
    viewport={{ once: true, margin: "-10% 0px" }} custom={i} {...p}>
    {children}
  </motion.div>
);
```

Other motion modules (keep each small, reduced-motion aware):
- **Smooth scroll:** Lenis (`new Lenis()` + rAF loop). Respect
  `prefers-reduced-motion` → skip.
- **Parallax:** `useScroll` + `useTransform` to drift cloud/screenshot layers
  ±40–100px.
- **Marquee tickers:** duplicate the list and translateX with CSS
  `@keyframes` or a Motion loop; pause on hover; wrap in `.su-fade-x`.
- **Counters:** count up on in-view (e.g. a `<NumberFlow/>`-style component or a
  simple rAF tween) for "62,000+", "87%", "+51 cities".
- **Accordion:** animate `height: auto` via Motion `AnimatePresence` + the
  plus→close icon rotating 135°.

---

## 5. The signature button (hover text-swap)

The reference's buttons stack two identical labels; on hover the inner wrap
shifts so the label slides up and is replaced. Recreate it:

```tsx
// CtaButton.tsx
import { ArrowRight } from "lucide-react";

export function CtaButton({ children, href, variant = "primary" }: any) {
  return (
    <a href={href} className={`su-btn su-btn--${variant}`}>
      <span className="su-btn__icon"><ArrowRight size={18} /></span>
      <span className="su-btn__label">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </a>
  );
}
```

```css
.su-btn {
  display:inline-flex; align-items:center; gap:8px;
  padding:16px 28px; border-radius:var(--r-pill);
  text-decoration:none; font: 600 16px/1 var(--font-body);
  transition: transform var(--dur) var(--ease-soft), box-shadow var(--dur) var(--ease-soft);
}
.su-btn--primary { background: var(--su-ink); color:#fff; box-shadow: var(--shadow-cta); }
.su-btn--ghost   { background: var(--su-surface); color: var(--su-ink); border:1px solid var(--su-line); }
.su-btn:hover    { transform: translateY(-1px); }

/* slide-up label swap */
.su-btn__label { position:relative; overflow:hidden; height:1.2em; display:grid; }
.su-btn__label > span { grid-area:1/1; transition: transform var(--dur) var(--ease-soft); }
.su-btn__label > span:nth-child(2) { transform: translateY(100%); }
.su-btn:hover .su-btn__label > span:nth-child(1) { transform: translateY(-100%); }
.su-btn:hover .su-btn__label > span:nth-child(2) { transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .su-btn, .su-btn__label > span { transition: none; }
}
```

App-store buttons: icon + "Download for iPhone" / "Get it on Android" with the
same label-swap; dark variant carries `--shadow-cta`.

---

## 6. Icons (no emoji)

- Web: `lucide-react`. Mobile: `lucide-react-native` or `@expo/vector-icons`.
- Map SuCAR concepts → icons:
  `Droplets`/`Sparkles` (wash), `Truck` (pickup/delivery), `MapPin` (location),
  `Car` (vehicle), `ListChecks`/`Timer` (queue & ETA), `Star` (ratings),
  `ShieldCheck` (operator/admin trust), `CreditCard` (payment),
  `BellRing` (reminders), `Route` (driver navigation).
- Icon-badge usage: 20–24px glyph centered in a `.su-badge` whose color comes
  from the `--acc-*` token for that category.

---

## 7. Imagery via Higgsfield

Generate, then compress (WebP/AVIF), self-host under `web-landing/public/`, and
set explicit `width`/`height` + `sizes`. Keep a consistent grade: bright,
optimistic, real cars + water, soft daylight.

**Prompt template:**
> `<subject>, professional car-wash context, <setting>, glossy clean vehicle,
> water droplets and foam highlights, bright natural daylight, shallow depth of
> field, modern cinematic, blue–cyan brand palette, high detail, photoreal —
> aspect <ratio>`

**Web landing shots:**
- Hero bg — "a freshly washed sedan on a sunlit forecourt, attendant rinsing,
  motion water spray, wide cinematic" · 16:9.
- Use-case card — "a driver in branded polo handing keys to a customer at a
  modern wash bay" · 3:2.
- Counter/video posters — "close-up foam mitt gliding over glossy car paint" · 1:1.
- Reviews avatars — "friendly diverse customer headshots, soft studio light" · 1:1.

**Mobile front-end (client/driver):**
- App store screenshots framed in device mockups (use the existing
  `Sucarcar` logo on splash).
- Onboarding illustration set: book → pickup → wash → deliver → rate.
- Driver map hero — "top-down city map with route pins, blue accent" · 9:19.5.

Always keep marketing strictly to client/driver + public messaging (operators &
admins are web-dashboard-only).

---

## 8. Accessibility & performance

- Color contrast ≥ 4.5:1 for text; don't rely on accent color alone — pair with
  an icon + label.
- All interactive elements keyboard-focusable; visible focus ring; buttons are
  real `<a>`/`<button>`.
- Honor `prefers-reduced-motion`: disable parallax, marquees, counters, and
  label-swaps (render the final state).
- Lazy-load below-the-fold images/video (`loading="lazy"`, `preload="none"`);
  hero image `fetchpriority="high"`.
- Backdrop-filter blur is expensive — cap to hero + a few cards; provide a solid
  fallback where unsupported.
- Ship one web framework (React + Vite) and the lucide icon set only — no
  duplicate UI libs.

---

## 9. Build checklist

- [ ] Tokens from §1 in `:root`; display + body fonts loaded with `font-display: swap`.
- [ ] Sections in §2 order; 1260px container; consistent vertical rhythm.
- [ ] Gradients/glass/badges from §3 applied (hero overlay + bottom fade present).
- [ ] `Reveal` stagger on every section; Lenis smooth scroll; reduced-motion guard.
- [ ] Signature label-swap CTA + store buttons (§5).
- [ ] Marquee status-chip tickers with edge fades; animated counters.
- [ ] **Zero emoji** — every glyph is a lucide icon (§6).
- [ ] All imagery Higgsfield-generated, optimized, self-hosted, dimensioned (§7).
- [ ] A11y + perf pass (§8). Copy is car-wash-on-mission, client/driver/public only.
- [ ] `npm run build` clean; Lighthouse: Perf ≥ 90, A11y ≥ 95.
```
