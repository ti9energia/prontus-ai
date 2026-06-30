import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getApiKeyByHash } from '@/lib/data';

/**
 * Public REST API helpers — consistent JSON envelopes + a bearer-key guard.
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
 * API-key gate. Reads `Authorization: Bearer <token>` (or `x-api-key`) and
 * validates by SHA-256 hash lookup against stored keys. In non-production
 * environments, `sk_test_*` tokens are accepted without a hash match so local
 * dev/testing works without seeding a real key.
 *
 * Returns a 401 response when the token is rejected, or `null` to proceed.
 */
export function authError(req: Request): NextResponse | null {
  const token = readToken(req);

  if (!token) {
    return apiError(
      'unauthorized',
      'Missing API key. Send `Authorization: Bearer <key>` or an `x-api-key` header.',
      401,
    );
  }

  // Dev fallback: accept sk_test_* without a DB lookup in non-production.
  if (process.env.NODE_ENV !== 'production' && token.startsWith('sk_test_')) {
    return null;
  }

  const hash = createHash('sha256').update(token).digest('hex');
  const record = getApiKeyByHash(hash);

  if (!record || record.revokedAt) {
    return apiError(
      'unauthorized',
      'Invalid or revoked API key.',
      401,
    );
  }

  return null;
}
