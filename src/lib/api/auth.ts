import { NextResponse } from 'next/server';

/**
 * Public REST API helpers — consistent JSON envelopes + a tiny bearer-key guard.
 *
 * Success responses are wrapped as `{ data }` and errors as
 * `{ error: { code, message } }` so every `/api/v1/*` route looks the same.
 */

/** Consistent success envelope: `{ data: <payload> }`. */
export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

/** Consistent error envelope: `{ error: { code, message } }`. */
export function apiError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Extracts the bearer token from `Authorization: Bearer <token>` or `x-api-key`. */
function readToken(req: Request): string {
  const header = req.headers.get('authorization') ?? '';
  if (/^bearer\s+/i.test(header)) return header.replace(/^bearer\s+/i, '').trim();
  return req.headers.get('x-api-key')?.trim() ?? '';
}

/**
 * Demo-grade API-key gate. Reads `Authorization: Bearer <token>` (or `x-api-key`)
 * and accepts any token that looks like a secret key (`sk_...`). Returns a 401
 * response when the token is missing or malformed, or `null` when the request is
 * allowed to proceed.
 *
 * PRODUCTION: replace the prefix check with a lookup against stored, hashed API
 * keys (e.g. SHA-256 of `sk_live_...`) scoped to the calling tenant — never trust
 * an arbitrary `sk_` prefix.
 */
export function authError(req: Request): NextResponse | null {
  const token = readToken(req);
  if (!token || !token.startsWith('sk_')) {
    return apiError(
      'unauthorized',
      'Missing or invalid API key. Send `Authorization: Bearer sk_...` or an `x-api-key` header.',
      401,
    );
  }
  return null;
}
