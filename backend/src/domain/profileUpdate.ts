/**
 * Profile self-update policy.
 *
 * SECURITY: the self-service "update my profile" endpoint must use an explicit
 * ALLOW-list of editable fields. A deny-list (deleting a few known-bad keys) is
 * unsafe because any field not explicitly removed — e.g. `role`, `isActive`,
 * `password`, `rating` — flows straight through to the database, enabling
 * privilege escalation and data tampering (mass-assignment).
 *
 * Fields deliberately NOT self-editable and why:
 *   - role, isActive          → authorization (would allow privilege escalation)
 *   - password                → must go through a dedicated, hashed change flow
 *   - email, nrc              → identity keys with uniqueness constraints; changing
 *                               them silently is account-takeover-adjacent and
 *                               should use a verified change flow (product decision)
 *   - rating*, driverRating*  → system-computed reputation, set by the review engine
 *   - id, googleId, authProvider, phoneVerified*, approvalStatus, timestamps
 *                             → system/identity-managed
 */

/** Fields any authenticated user may edit about themselves, regardless of role. */
const COMMON_EDITABLE_FIELDS = ['name', 'phone', 'address', 'bio', 'profilePictureUrl'] as const;

/** Additional fields editable only by the matching role. */
const ROLE_EDITABLE_FIELDS: Record<string, readonly string[]> = {
  client: ['businessName', 'isBusiness'],
  driver: ['licenseNo', 'licenseType', 'licenseExpiry', 'maritalStatus', 'availability'],
  carwash: ['carWashName', 'location', 'washingBays', 'carWashPictureUrl'],
  admin: [],
  subadmin: [],
};

export interface SanitizedProfileUpdate {
  /** Whitelisted fields that may be persisted. */
  sanitized: Record<string, unknown>;
  /** Keys that were present in the input but are not self-editable (dropped). */
  rejected: string[];
}

/**
 * Returns only the fields a user of `role` is permitted to change about
 * themselves, plus the list of rejected (non-editable) keys for logging.
 */
export function sanitizeProfileUpdate(
  role: string,
  body: Record<string, unknown> | null | undefined
): SanitizedProfileUpdate {
  const allowed = new Set<string>([
    ...COMMON_EDITABLE_FIELDS,
    ...(ROLE_EDITABLE_FIELDS[role] ?? []),
  ]);

  const sanitized: Record<string, unknown> = {};
  const rejected: string[] = [];

  for (const key of Object.keys(body ?? {})) {
    if (allowed.has(key)) {
      sanitized[key] = (body as Record<string, unknown>)[key];
    } else {
      rejected.push(key);
    }
  }

  return { sanitized, rejected };
}

/** Exposed for tests/documentation. */
export const __editableFields = { COMMON_EDITABLE_FIELDS, ROLE_EDITABLE_FIELDS };
