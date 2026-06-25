# Hero imagery

Drop the landing **hero photo** here as:

```
hero-car.jpg   (or .webp — update the <img src> in LandingPage.tsx if you change the extension)
```

The landing (`frontend/src/pages/LandingPage.tsx`) renders:

```tsx
<img className="lp-hero__photo" src="/images/hero/hero-car.jpg" ... />
```

If the file is absent the hero gracefully falls back to a brand gradient — nothing breaks.

## Specs
- **Dimensions:** 1600 × 840 px (the banner is `aspect-ratio: 16 / 8.4`). Anything close works; it is `object-fit: cover`.
- **Format:** WebP preferred (`hero-car.webp`), else optimized JPG.
- **Weight:** keep under ~300 KB. Compress (squoosh.app / `sharp`).
- **Subject:** a real, freshly-washed car at a wash bay — clean, glossy, water/foam highlights, bright daylight. Avoid synthetic/AI-looking renders.
- **Composition:** keep the focal point centred-right; the top-left carries the floating status chips, so leave that area uncluttered.

Additional hero shots (use-case card, etc.) can live alongside, e.g. `hero-usecase.jpg`.
