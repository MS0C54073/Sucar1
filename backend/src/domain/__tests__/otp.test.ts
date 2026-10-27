/**
 * Security regression tests for phone OTP verification:
 *  - each stored code allows MAX_OTP_ATTEMPTS guesses, then is burned;
 *  - the fixed development code is never accepted in production.
 */
import { MAX_OTP_ATTEMPTS, otpMatches, otpPrecheck, isDevMockOtpAllowed } from '../otp';

type Row = Record<string, any>;
const table = new Map<string, Row>();

/**
 * Minimal in-memory stand-in for the supabase-js query builder, covering only
 * the calls DBService makes on phone_verification_codes and users.
 */
function fakeFrom(name: string) {
  const filters: [string, unknown][] = [];
  let op: 'select' | 'update' | 'delete' = 'select';
  let patch: Row = {};
  let returning = false;
  const matching = () =>
    name === 'phone_verification_codes'
      ? [...table.values()].filter((r) => filters.every(([k, v]) => r[k] === v))
      : [];
  const run = () => {
    const rows = matching();
    if (op === 'update') rows.forEach((r) => Object.assign(r, patch));
    if (op === 'delete') rows.forEach((r) => table.delete(r.phone));
    return { data: op === 'select' || returning ? rows.map((r) => ({ ...r })) : null, error: null };
  };
  const builder: any = {
    select: () => {
      if (op === 'select') op = 'select';
      else returning = true;
      return builder;
    },
    update: (p: Row) => ((op = 'update'), (patch = p), builder),
    delete: () => ((op = 'delete'), builder),
    eq: (k: string, v: unknown) => (filters.push([k, v]), builder),
    maybeSingle: async () => {
      const { data } = run();
      return { data: data?.[0] ?? null, error: null };
    },
    then: (resolve: (v: unknown) => void) => resolve(run()),
  };
  return builder;
}

jest.mock('../../config/supabase', () => ({ supabase: { from: (t: string) => fakeFrom(t) } }));

const { DBService } = require('../../services/db-service');

const PHONE = '+260977000001';
const store = (overrides: Row = {}) =>
  table.set(PHONE, {
    phone: PHONE,
    code: '482913',
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    attempts: 0,
    ...overrides,
  });

describe('otp domain', () => {
  const future = new Date(Date.now() + 60_000);

  it('accepts only an exact match', () => {
    expect(otpMatches('482913', '482913')).toBe(true);
    expect(otpMatches('482913', '482914')).toBe(false);
    expect(otpMatches('482913', '48291')).toBe(false);
    expect(otpMatches('482913', undefined as unknown as string)).toBe(false);
  });

  it('reports expired and locked codes', () => {
    expect(otpPrecheck({ code: '1', expiresAt: future, attempts: 0 })).toBe('ok');
    expect(otpPrecheck({ code: '1', expiresAt: new Date(Date.now() - 1), attempts: 0 })).toBe('expired');
    expect(otpPrecheck({ code: '1', expiresAt: future, attempts: MAX_OTP_ATTEMPTS })).toBe('locked');
  });

  it('never allows the dev mock code in production', () => {
    expect(isDevMockOtpAllowed({ NODE_ENV: 'production' })).toBe(false);
    expect(isDevMockOtpAllowed({ NODE_ENV: 'development' })).toBe(true);
  });
});

describe('DBService.verifyPhoneCode', () => {
  beforeEach(() => table.clear());

  it('accepts the right code once and consumes it', async () => {
    store();
    expect(await DBService.verifyPhoneCode(PHONE, '482913')).toBe(true);
    expect(table.has(PHONE)).toBe(false);
    expect(await DBService.verifyPhoneCode(PHONE, '482913')).toBe(false);
  });

  it('counts each wrong guess', async () => {
    store();
    expect(await DBService.verifyPhoneCode(PHONE, '000000')).toBe(false);
    expect(await DBService.verifyPhoneCode(PHONE, '000001')).toBe(false);
    expect(table.get(PHONE)?.attempts).toBe(2);
  });

  it(`burns the code after ${MAX_OTP_ATTEMPTS} wrong guesses, even if the next guess is right`, async () => {
    store();
    for (let i = 0; i < MAX_OTP_ATTEMPTS; i++) {
      expect(await DBService.verifyPhoneCode(PHONE, `00000${i}`)).toBe(false);
    }
    expect(await DBService.verifyPhoneCode(PHONE, '482913')).toBe(false);
    expect(table.has(PHONE)).toBe(false);
  });

  it('rejects and removes an expired code', async () => {
    store({ expires_at: new Date(Date.now() - 1000).toISOString() });
    expect(await DBService.verifyPhoneCode(PHONE, '482913')).toBe(false);
    expect(table.has(PHONE)).toBe(false);
  });

  it('rejects a guess that loses the race to count an attempt', async () => {
    store();
    // Another request counts a guess between our read and our update.
    const realGet = table.get.bind(table);
    let reads = 0;
    jest.spyOn(table, 'values').mockImplementation(function (this: Map<string, Row>) {
      reads += 1;
      if (reads === 2) realGet(PHONE)!.attempts += 1;
      return Map.prototype.values.call(this);
    });
    expect(await DBService.verifyPhoneCode(PHONE, '482913')).toBe(false);
    jest.restoreAllMocks();
  });

  it('resets the attempt count when a new code is issued', async () => {
    store({ attempts: 4 });
    // Upsert is not modelled by the fake; check the row DBService would write.
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const supabase = require('../../config/supabase').supabase;
    const spy = jest.spyOn(supabase, 'from').mockReturnValue({ upsert });
    await DBService.storePhoneVerificationCode(PHONE, '111111', 10);
    expect(upsert.mock.calls[0][0]).toMatchObject({ phone: PHONE, code: '111111', attempts: 0 });
    spy.mockRestore();
  });
});

describe('SMSService.verifyCode without Twilio', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  const load = (nodeEnv: string) => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, NODE_ENV: nodeEnv };
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;
    jest.doMock('twilio', () => () => ({}));
    return require('../../services/smsService').SMSService;
  };

  it('rejects the fixed mock code in production', async () => {
    const SMSService = load('production');
    expect(SMSService.isConfigured()).toBe(false);
    expect(await SMSService.verifyCode(PHONE, '123456')).toBe(false);
  });

  it('still accepts the mock code in development', async () => {
    const SMSService = load('development');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await SMSService.verifyCode(PHONE, '123456')).toBe(true);
  });
});
