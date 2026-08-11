import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '@/lib/config';

export interface RecordingTokenPayload {
  jobId: string;
  orgId: string;
  exp: number;
  allowedOrigins: string[];
}

function signingSecret(): string {
  const secret = config.auth.secret;
  if (secret) return secret;
  if (!config.runtime.isProd) return 'auronis-b2b-development-only-secret';
  throw new Error('AUTH_SECRET is required to issue recording upload tokens.');
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', signingSecret()).update(encodedPayload).digest('base64url');
}

export function issueRecordingToken(
  payload: Omit<RecordingTokenPayload, 'exp'>,
  ttlSeconds = 2 * 60 * 60,
): { token: string; expiresAt: string } {
  const exp = Math.floor(Date.now() / 1_000) + Math.min(Math.max(ttlSeconds, 60), 7_200);
  const fullPayload: RecordingTokenPayload = { ...payload, exp };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  return {
    token: `rec_${encoded}.${sign(encoded)}`,
    expiresAt: new Date(exp * 1_000).toISOString(),
  };
}

export function verifyRecordingToken(token: string): RecordingTokenPayload | null {
  if (!token.startsWith('rec_')) return null;
  const [encoded, receivedSignature] = token.slice(4).split('.');
  if (!encoded || !receivedSignature) return null;

  try {
    const expectedSignature = sign(encoded);
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(receivedSignature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as RecordingTokenPayload;
    if (!payload.jobId || !payload.orgId || !Array.isArray(payload.allowedOrigins)) return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1_000)) return null;
    return payload;
  } catch {
    return null;
  }
}
