import { sanitizeProfileUpdate } from '../profileUpdate';

describe('sanitizeProfileUpdate', () => {
  // SECURITY regression: the exact mass-assignment escalation that was possible
  // via PUT /api/auth/profile must be fully stripped.
  it('drops privilege/identity/system fields for a client', () => {
    const { sanitized, rejected } = sanitizeProfileUpdate('client', {
      name: 'Mallory',
      role: 'admin',
      isActive: true,
      password: 'pwned',
      email: 'attacker@evil.com',
      nrc: '999999/99/9',
      rating: 5,
      ratingCount: 9999,
      id: 'some-other-user-id',
    });

    expect(sanitized).toEqual({ name: 'Mallory' });
    expect(rejected).toEqual(
      expect.arrayContaining([
        'role',
        'isActive',
        'password',
        'email',
        'nrc',
        'rating',
        'ratingCount',
        'id',
      ])
    );
    expect(sanitized).not.toHaveProperty('role');
    expect(sanitized).not.toHaveProperty('isActive');
    expect(sanitized).not.toHaveProperty('password');
  });

  it('keeps common editable fields', () => {
    const { sanitized } = sanitizeProfileUpdate('client', {
      name: 'Alice',
      phone: '+260970000000',
      address: '12 Cairo Rd',
      bio: 'hi',
      profilePictureUrl: 'https://x/y.png',
    });
    expect(sanitized).toEqual({
      name: 'Alice',
      phone: '+260970000000',
      address: '12 Cairo Rd',
      bio: 'hi',
      profilePictureUrl: 'https://x/y.png',
    });
  });

  it('enforces role-specific field isolation', () => {
    // carWashName is editable by a carwash...
    expect(sanitizeProfileUpdate('carwash', { carWashName: 'Sparkle' }).sanitized).toEqual({
      carWashName: 'Sparkle',
    });
    // ...but not by a client.
    const asClient = sanitizeProfileUpdate('client', { carWashName: 'Sparkle' });
    expect(asClient.sanitized).toEqual({});
    expect(asClient.rejected).toContain('carWashName');
  });

  it('allows driver to toggle availability but client cannot', () => {
    expect(sanitizeProfileUpdate('driver', { availability: false }).sanitized).toEqual({
      availability: false,
    });
    expect(sanitizeProfileUpdate('client', { availability: false }).sanitized).toEqual({});
  });

  it('handles null/undefined body safely', () => {
    expect(sanitizeProfileUpdate('client', null).sanitized).toEqual({});
    expect(sanitizeProfileUpdate('client', undefined).rejected).toEqual([]);
  });

  it('treats an unknown role as having only common fields', () => {
    const { sanitized, rejected } = sanitizeProfileUpdate('ghost', {
      name: 'X',
      carWashName: 'Y',
    });
    expect(sanitized).toEqual({ name: 'X' });
    expect(rejected).toContain('carWashName');
  });
});
