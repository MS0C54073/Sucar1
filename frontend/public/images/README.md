# Web image assets (`frontend/public/images/`)

Everything in `frontend/public/` is served statically at the site root, so a file
at `frontend/public/images/hero/hero-car.jpg` is reachable at `/images/hero/hero-car.jpg`.

## Directory structure

```
frontend/public/images/
├── Sucarcar.jpeg          # CURRENT brand logo — referenced app-wide; do NOT move
├── Sucar.png              # legacy logo asset
├── brand/                 # new logo / wordmark variants  → /images/brand/*
├── hero/                  # landing hero photo(s)         → /images/hero/hero-car.jpg
├── illustrations/         # section photos / illustrations → /images/illustrations/*
├── icons/                 # favicons, og-image, raster icons → /images/icons/*
└── badges/                # (optional) official store badge art → /images/badges/*
```

Each subfolder has its own README with specs. Most **UI icons are inline SVG** in
`frontend/src/components/icons/Icon.tsx` (and store badges in
`src/components/landing/StoreBadges.tsx`) — add vector glyphs there, not as files.

## What to drop in now
- **Hero photo:** `hero/hero-car.jpg` (1600×840, <300 KB, real glossy car). The
  landing already points at it and falls back to a gradient until it exists.

## Mobile app assets (separate project)
The Expo mobile app does **not** read from this folder. Its assets live in:

```
mobile/assets/                 # Expo static assets
├── Sucar.png
├── Sucarcar.jpeg
├── images/   (recommended)    # screens / illustrations
└── icons/    (recommended)    # app icon, splash, adaptive icon
```

Mobile asset paths are wired in `mobile/app.config.js` (icon, splash, adaptive
icon). Keep web and mobile assets independent.
