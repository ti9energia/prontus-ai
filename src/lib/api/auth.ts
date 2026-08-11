import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getApiKeyByHash } from '@/lib/data';
import { config } from '@/lib/config';
import type { ApiKey, ApiScope } from '@/lib/types';

/** Consistent success envelope: `{ data: <payload> }`. */
export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

/** Consistent error envelope: `{ error: { code, message } }`. */
export function apiError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function readToken(req: Request): string {
  const header = req.headers.get('authorization') ?? '';
  if (/^bearer\s+/i.test(header)) return header.replace(/^bearer\s+/i, '').trim();
  return req.headers.get('x-api-key')?.trim() ?? '';
}

export interface ApiAuthContext {
  orgId: string;
  keyId: string;
  scopes: ApiScope[];
  allowedOrigins: string[];
}

export type ApiAuthResult =
  | { context: ApiAuthContext; error: null }
  | { context: null; error: NextResponse };

function contextFromKey(record: ApiKey): ApiAuthContext {
  return {
    orgId: record.orgId,
    keyId: record.id,
    scopes: record.scopes?.length ? record.scopes : ['*'],
    allowedOrigins: record.allowedOrigins ?? [],
  };
}

/**
 * Authenticates a partner API key and returns its tenant context.
 * Test keys are accepted only outside production and always map to the demo tenant.
 */
export function authenticateApiKey(req: Request): ApiAuthResult {
  const token = readToken(req);

  if (!token) {
    return {
      context: null,
      error: apiError(
        'unauthorized',
        'Missing API key. Send `Authorization: Bearer <key>` or an `x-api-key` header.',
        401,
      ),
    };
  }

  if (token.startsWith('sk_test_')) {
    if (config.runtime.isProd) {
      return {
        context: null,
        error: apiError('unauthorized', 'Test API keys are disabled in production.', 401),
      };
    }
    return {
      context: {
        orgId: 'ten_0001',
        keyId: 'key_dev',
        scopes: ['*'],
        allowedOrigins: ['http://localhost:3000'],
      },
      error: null,
    };
  }

  const hash = createHash('sha256').update(token).digest('hex');
  const record = getApiKeyByHash(hash);
  if (!record || record.revokedAt) {
    return {
      context: null,
      error: apiError('unauthorized', 'Invalid or revoked API key.', 401),
    };
  }

  return { context: contextFromKey(record), error: null };
}

/** Returns a 403 response when the authenticated key lacks a required scope. */
export function scopeError(context: ApiAuthContext, required: ApiScope): NextResponse | null {
  if (context.scopes.includes('*') || context.scopes.includes(required)) return null;
  return apiError('forbidden', `API key is missing required scope: ${required}.`, 403);
}

/** Backwards-compatible gate used by the existing REST endpoints. */
export function authError(req: Request): NextResponse | null {
  return authenticateApiKey(req).error;
}
