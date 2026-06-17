/**
 * Security regression tests for JWT secret resolution.
 * Locks in the fail-fast behaviour: production must never issue tokens signed
 * with a missing/weak secret, while development gets a clearly-insecure fallback.
 */

// Neutralise dotenv so the test is deterministic regardless of a local backend/.env.
jest.mock('dotenv', () => ({ __esModule: true, default: { config: () => ({}) }, config: () => ({}) }));

describe('getJwtSecret', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns a configured strong secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-very-strong-random-secret-value';
    const { getJwtSecret } = require('../jwt');
    expect(getJwtSecret()).toBe('a-very-strong-random-secret-value');
  });

  it('falls back to an insecure dev secret (with a warning) outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { getJwtSecret } = require('../jwt');
    expect(getJwtSecret()).toBeTruthy();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('throws in production when the secret is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    const { getJwtSecret } = require('../jwt');
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('throws in production when the secret is too short', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    const { assertAuthConfig } = require('../jwt');
    expect(() => assertAuthConfig()).toThrow(/at least/);
  });
});
