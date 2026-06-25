import {
  isSelfRegisterableRole,
  isPrivilegedRole,
  isUserRole,
  SELF_REGISTERABLE_ROLES,
} from '../roles';

describe('role policy', () => {
  describe('isSelfRegisterableRole', () => {
    it.each(['client', 'driver', 'carwash'])('allows non-privileged role %s', (role) => {
      expect(isSelfRegisterableRole(role)).toBe(true);
    });

    // SECURITY regression: privileged roles must never be self-assignable.
    it.each(['admin', 'subadmin'])('rejects privileged role %s', (role) => {
      expect(isSelfRegisterableRole(role)).toBe(false);
    });

    it.each([undefined, null, '', 'superuser', 123, {}])(
      'rejects invalid value %p',
      (value) => {
        expect(isSelfRegisterableRole(value as unknown)).toBe(false);
      }
    );
  });

  describe('isPrivilegedRole', () => {
    it('identifies admin and subadmin as privileged', () => {
      expect(isPrivilegedRole('admin')).toBe(true);
      expect(isPrivilegedRole('subadmin')).toBe(true);
      expect(isPrivilegedRole('client')).toBe(false);
    });
  });

  describe('isUserRole', () => {
    it('accepts known roles and rejects unknown', () => {
      expect(isUserRole('admin')).toBe(true);
      expect(isUserRole('nope')).toBe(false);
    });
  });

  it('SELF_REGISTERABLE_ROLES excludes all privileged roles', () => {
    for (const role of SELF_REGISTERABLE_ROLES) {
      expect(isPrivilegedRole(role)).toBe(false);
    }
  });
});
