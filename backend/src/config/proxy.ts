/**
 * Express `trust proxy` setting.
 *
 * SECURITY: hosted deployments (Render, Fly, a load balancer, nginx) put a
 * reverse proxy in front of the API. Without trusting it, `req.ip` is the
 * proxy's address, so the per-IP rate limiters on login/OTP would share ONE
 * bucket across every user — a single attacker could lock everyone out.
 *
 * Trusting too much is also dangerous: with `true`, a client can spoof
 * X-Forwarded-For and dodge the limiters. So the default is exactly one hop in
 * production (the platform proxy) and off in development (direct connections).
 *
 * Override with TRUST_PROXY:
 *   - a hop count, e.g. "1" or "2"
 *   - "false" to disable
 *   - an Express subnet/address list, e.g. "loopback, 10.0.0.0/8"
 * "true" is rejected because it lets any client spoof its IP.
 */
export type TrustProxySetting = number | boolean | string;

export function resolveTrustProxy(env: NodeJS.ProcessEnv = process.env): TrustProxySetting {
  const raw = env.TRUST_PROXY?.trim();

  if (!raw) {
    return env.NODE_ENV === 'production' ? 1 : false;
  }

  if (raw === 'false' || raw === '0') return false;

  if (raw === 'true') {
    throw new Error(
      'TRUST_PROXY=true trusts every X-Forwarded-For hop and lets clients spoof their IP. ' +
        'Set the number of proxy hops instead (usually TRUST_PROXY=1).'
    );
  }

  if (/^\d+$/.test(raw)) return Number(raw);

  return raw;
}
