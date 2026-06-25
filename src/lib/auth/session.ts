/**
 * Isomorphic session tokens — HMAC-SHA256 over Web Crypto (no deps, no
 * node:crypto), so the exact same code verifies sessions in edge middleware
 * and in Node route handlers.
 *
 * Token format:  base64url(JSON payload) + "." + base64url(HMAC)
 *
 * Security model:
 * - Signed with AUTH_SECRET. A dev fallback secret keeps local dev working,
 *   but OWNER sessions are ONLY honored when a real AUTH_SECRET is set
 *   (`hasStrongSecret`), so a leaked/known fallback can never forge owner
 *   access on the live site.
 */

export const SESSION_COOKIE = 'aureon_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type Role = 'owner' | 'doctor';

export interface SessionPayload {
  sub: string; // email
  role: Role;
  name: string;
  exp: number; // epoch seconds
}

const DEV_FALLBACK = 'aureon-dev-secret-change-me';

function secret(): string {
  return process.env.AUTH_SECRET || DEV_FALLBACK;
}

/** True only when a real AUTH_SECRET is configured (not the dev fallback). */
export function hasStrongSecret(): boolean {
  return !!process.env.AUTH_SECRET;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function strToB64url(s: string): string {
  return bytesToB64url(encoder.encode(s));
}
function b64urlToStr(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return decoder.decode(bytes);
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return bytesToB64url(new Uint8Array(sig));
}

/** Constant-time string compare (signatures are fixed length). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createSession(input: {
  email: string;
  role: Role;
  name: string;
  ttl?: number;
}): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (input.ttl ?? SESSION_TTL_SECONDS);
  const payload: SessionPayload = { sub: input.email, role: input.role, name: input.name, exp };
  const body = strToB64url(JSON.stringify(payload));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null; // base64url has no '.', so a valid token has exactly one
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expected = await sign(body);
  if (!safeEqual(sig, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(b64urlToStr(body));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.role !== 'owner' && payload.role !== 'doctor') return null;
  // Owner access requires a real secret, regardless of a valid-looking token.
  if (payload.role === 'owner' && !hasStrongSecret()) return null;
  // Fail-closed on live deploys: the dev fallback secret must never authorize any
  // session in production, or a leaked/known fallback could forge doctor access too.
  if (!hasStrongSecret() && process.env.NODE_ENV === 'production') return null;
  return payload;
}

/** Parse a single cookie value from a raw Cookie header (runtime-agnostic). */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1 && part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}
