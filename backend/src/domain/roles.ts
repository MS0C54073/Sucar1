/**
 * Role policy — single source of truth.
 *
 * Centralising role definitions here (rather than scattering string arrays
 * across controllers/routes) keeps authorization decisions consistent and
 * unit-testable, and makes privilege boundaries explicit.
 */

export const ALL_ROLES = ['client', 'driver', 'carwash', 'admin', 'subadmin'] as const;
export type UserRole = (typeof ALL_ROLES)[number];

/**
 * Roles a user is allowed to assign to themselves through ANY public sign-up
 * path (password, Google, phone OTP). Privileged roles are intentionally
 * excluded — they can only be provisioned server-side.
 */
export const SELF_REGISTERABLE_ROLES: readonly UserRole[] = ['client', 'driver', 'carwash'];

/** Roles that grant elevated/administrative access. */
export const PRIVILEGED_ROLES: readonly UserRole[] = ['admin', 'subadmin'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
}

export function isSelfRegisterableRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (SELF_REGISTERABLE_ROLES as readonly string[]).includes(value);
}

export function isPrivilegedRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (PRIVILEGED_ROLES as readonly string[]).includes(value);
}
