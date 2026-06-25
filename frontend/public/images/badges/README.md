# Store badges

The App Store + Google Play badges on the landing are rendered as **inline SVG**
(`frontend/src/components/landing/StoreBadges.tsx`) — crisp at any size, no image
files needed, theme-safe.

Use this folder only if you later switch to the official downloadable badge
artwork from Apple/Google (subject to their brand guidelines):
- `app-store-badge.svg`
- `google-play-badge.png`

If you do, swap the SVG markup in `StoreBadges.tsx` for `<img>` tags pointing here.
