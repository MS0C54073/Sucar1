/**
 * Security regression tests for the `trust proxy` setting.
 * Without it, every user behind the hosting proxy shares one rate-limit bucket;
 * with too much trust, clients can spoof X-Forwarded-For to dodge the limiters.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { resolveTrustProxy } from '../proxy';

describe('resolveTrustProxy', () => {
  it('trusts exactly one hop in production by default', () => {
    expect(resolveTrustProxy({ NODE_ENV: 'production' })).toBe(1);
  });

  it('is off outside production by default', () => {
    expect(resolveTrustProxy({ NODE_ENV: 'development' })).toBe(false);
    expect(resolveTrustProxy({})).toBe(false);
  });

  it('accepts a hop count, false, or an address list', () => {
    expect(resolveTrustProxy({ NODE_ENV: 'production', TRUST_PROXY: '2' })).toBe(2);
    expect(resolveTrustProxy({ NODE_ENV: 'production', TRUST_PROXY: 'false' })).toBe(false);
    expect(resolveTrustProxy({ NODE_ENV: 'production', TRUST_PROXY: '0' })).toBe(false);
    expect(resolveTrustProxy({ TRUST_PROXY: 'loopback, 10.0.0.0/8' })).toBe('loopback, 10.0.0.0/8');
  });

  it('rejects TRUST_PROXY=true because it allows IP spoofing', () => {
    expect(() => resolveTrustProxy({ TRUST_PROXY: 'true' })).toThrow(/spoof/);
  });
});

describe('rate limiting behind one proxy hop', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll((done) => {
    const app = express();
    app.set('trust proxy', resolveTrustProxy({ NODE_ENV: 'production' }));
    app.use(rateLimit({ windowMs: 60_000, max: 2, standardHeaders: true, legacyHeaders: false }));
    app.get('/', (_req, res) => res.send('ok'));
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const hit = (forwardedFor: string) =>
    fetch(baseUrl, { headers: { 'X-Forwarded-For': forwardedFor } }).then((r) => r.status);

  it('gives each real client its own bucket', async () => {
    expect(await hit('203.0.113.1')).toBe(200);
    expect(await hit('203.0.113.1')).toBe(200);
    expect(await hit('203.0.113.1')).toBe(429);
    // A different user behind the same proxy is not locked out.
    expect(await hit('203.0.113.2')).toBe(200);
  });

  it('ignores client-supplied hops beyond the trusted proxy', async () => {
    // The attacker prepends a fake IP; only the proxy-appended one counts.
    expect(await hit('198.51.100.9, 203.0.113.3')).toBe(200);
    expect(await hit('198.51.100.10, 203.0.113.3')).toBe(200);
    expect(await hit('198.51.100.11, 203.0.113.3')).toBe(429);
  });
});
