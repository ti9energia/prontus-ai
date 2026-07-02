import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getUserByEmail } from '@/lib/data';
import { config } from '@/lib/config';
import { hasStrongSecret, type Role } from './session';

/**
 * Credential verification (Node-only — imported only by the login route).
 * Fail-closed: owner login is disabled unless a real AUTH_SECRET AND an owner
 * password (hash preferred) are configured. The test/demo doctor is low-stakes
 * (sample data only) and has a sensible default password.
 *
 * No real PII lives here: the owner identity is configured entirely via env
 * (OWNER_EMAIL / OWNER_NAME / OWNER_PASSWORD[_HASH]); the defaults are neutral.
 */

export interface Identity {
  role: Role;
  email: string;
  name: string;
}

function timingEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Verify a scrypt hash of the form `scrypt$<saltHex>$<hashHex>`. */
function verifyScrypt(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** Hashes a password for storage (`scrypt$<saltHex>$<hashHex>`) — same format
 *  and parameters as `scripts/hash-password.mjs`, used by self-service signup. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Returns the identity for valid credentials, or null (fail-closed). */
export function authenticate(emailRaw: string, password: string): Identity | null {
  const email = emailRaw.trim().toLowerCase();
  const ownerEmail = config.auth.ownerEmail.trim().toLowerCase();
  const testEmail = config.auth.testDoctorEmail.trim().toLowerCase();

  if (email === ownerEmail) {
    if (!hasStrongSecret()) return null; // owner disabled without a real secret
    const hash = config.auth.ownerPasswordHash?.trim();
    const plain = config.auth.ownerPassword;
    let ok = false;
    if (hash) ok = verifyScrypt(password, hash);
    else if (plain) ok = timingEqual(password, plain);
    else return null; // no owner password configured → disabled
    return ok ? { role: 'owner', email: ownerEmail, name: config.auth.ownerName } : null;
  }

  if (email === testEmail) {
    const expected = config.auth.testDoctorPassword;
    return timingEqual(password, expected) ? { role: 'doctor', email: testEmail, name: 'Dra. Mariana Barreto' } : null;
  }

  // Self-service accounts (signup) — real user row with a real scrypt hash.
  // Every non-owner identity gets session role 'doctor': the binary session
  // role only gates /owner vs /app; the richer RoleKey (org_admin etc.) drives
  // in-app entitlements separately (lib/workspace/entitlements.ts).
  const user = getUserByEmail(email);
  if (user?.passwordHash && user.status === 'active') {
    return verifyScrypt(password, user.passwordHash) ? { role: 'doctor', email: user.email, name: user.name } : null;
  }

  return null;
}

/** One-click public demo → a doctor session over the sample clinic. */
export function demoIdentity(): Identity {
  return { role: 'doctor', email: 'demo@auronishealth.com', name: 'Dra. Helena Vasconcelos' };
}
