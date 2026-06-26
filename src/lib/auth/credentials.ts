import { scryptSync, timingSafeEqual } from 'node:crypto';
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

const DEFAULT_OWNER_EMAIL = 'owner@aureonhealth.com';
const DEFAULT_TEST_EMAIL = 'marianabarreto@aureonhealth.com';
const DEFAULT_TEST_PASSWORD = 'aureon-demo';

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

/** Returns the identity for valid credentials, or null (fail-closed). */
export function authenticate(emailRaw: string, password: string): Identity | null {
  const email = emailRaw.trim().toLowerCase();
  const ownerEmail = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const testEmail = (process.env.TEST_DOCTOR_EMAIL || DEFAULT_TEST_EMAIL).trim().toLowerCase();

  if (email === ownerEmail) {
    if (!hasStrongSecret()) return null; // owner disabled without a real secret
    const hash = process.env.OWNER_PASSWORD_HASH?.trim();
    const plain = process.env.OWNER_PASSWORD;
    let ok = false;
    if (hash) ok = verifyScrypt(password, hash);
    else if (plain) ok = timingEqual(password, plain);
    else return null; // no owner password configured → disabled
    return ok ? { role: 'owner', email: ownerEmail, name: process.env.OWNER_NAME || 'Owner' } : null;
  }

  if (email === testEmail) {
    const expected = process.env.TEST_DOCTOR_PASSWORD || DEFAULT_TEST_PASSWORD;
    return timingEqual(password, expected) ? { role: 'doctor', email: testEmail, name: 'Dra. Mariana Barreto' } : null;
  }

  return null;
}

/** One-click public demo → a doctor session over the sample clinic. */
export function demoIdentity(): Identity {
  return { role: 'doctor', email: 'demo@aureonhealth.com', name: 'Dra. Helena Vasconcelos' };
}
