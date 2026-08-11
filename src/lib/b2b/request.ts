import { NextResponse } from 'next/server';
import { apiError, authenticateApiKey, scopeError } from '@/lib/api';
import type { ApiScope } from '@/lib/types';
import { verifyRecordingToken } from './recording-token';

export interface B2bJobAccess {
  orgId: string;
  keyId?: string;
  allowedOrigins: string[];
  via: 'api_key' | 'recording_token';
}

export type B2bJobAccessResult =
  | { access: B2bJobAccess; error: null }
  | { access: null; error: NextResponse };

function bearer(req: Request): string {
  const value = req.headers.get('authorization') ?? '';
  return /^bearer\s+/i.test(value) ? value.replace(/^bearer\s+/i, '').trim() : '';
}

export function authorizeJobRequest(
  req: Request,
  jobId: string,
  requiredScope: ApiScope,
): B2bJobAccessResult {
  const uploadToken = bearer(req);
  if (uploadToken.startsWith('rec_')) {
    const payload = verifyRecordingToken(uploadToken);
    if (!payload || payload.jobId !== jobId) {
      return { access: null, error: apiError('unauthorized', 'Invalid or expired recording token.', 401) };
    }
    return {
      access: {
        orgId: payload.orgId,
        allowedOrigins: payload.allowedOrigins,
        via: 'recording_token',
      },
      error: null,
    };
  }

  const auth = authenticateApiKey(req);
  if (auth.error) return { access: null, error: auth.error };
  const forbidden = scopeError(auth.context, requiredScope);
  if (forbidden) return { access: null, error: forbidden };
  return {
    access: {
      orgId: auth.context.orgId,
      keyId: auth.context.keyId,
      allowedOrigins: auth.context.allowedOrigins,
      via: 'api_key',
    },
    error: null,
  };
}

function requestOrigin(req: Request): string | null {
  return req.headers.get('origin');
}

export function originError(req: Request, allowedOrigins: string[]): NextResponse | null {
  const origin = requestOrigin(req);
  if (!origin) return null;
  if (allowedOrigins.includes(origin)) return null;
  return apiError('origin_not_allowed', 'This browser origin is not allowed for the API key.', 403);
}

export function withCors(
  response: NextResponse,
  req: Request,
  allowedOrigins: string[],
): NextResponse {
  const origin = requestOrigin(req);
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

/** Preflight may be public; the actual request still requires a signed short-lived token. */
export function recordingPreflight(req: Request): NextResponse {
  const origin = requestOrigin(req) ?? '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    },
  });
}
