import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/config/mapbox-token
 *
 * Serves the Mapbox PUBLIC token from server-side env so it is never committed to
 * source control or baked into the frontend bundle. The token still reaches the
 * browser at runtime (Mapbox GL runs client-side and requires it) — the real abuse
 * protection is URL restrictions configured on the token in the Mapbox dashboard.
 *
 * Public endpoint: maps render on pre-auth pages (landing/login) too.
 */
router.get('/mapbox-token', (_req: Request, res: Response) => {
  const token = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';

  if (!token || !token.startsWith('pk.')) {
    res.status(404).json({
      success: false,
      message: 'Mapbox token not configured on the server. Set MAPBOX_TOKEN in backend/.env.',
    });
    return;
  }

  // Allow short-term caching; the client re-fetches after expiry.
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    success: true,
    token,
    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  });
});

export default router;
