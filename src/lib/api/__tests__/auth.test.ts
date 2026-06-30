import { describe, it, expect } from 'vitest';
import { apiError, authError, json } from '@/lib/api/auth';

/** Build a bare Request with the given headers (no body needed for the guard). */
function reqWith(headers: Record<string, string> = {}): Request {
  return new Request('http://x', { headers });
}

describe('authError — bearer/api-key gate', () => {
  it('returns 401 when no Authorization or x-api-key header is present', async () => {
    const res = authError(reqWith());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    const body = await res!.json();
    expect(body.error.code).toBe('unauthorized');
    expect(typeof body.error.message).toBe('string');
  });

  it('returns 401 when the bearer token does not start with sk_', async () => {
    const res = authError(reqWith({ authorization: 'Bearer abc123' }));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('returns 401 when the x-api-key does not start with sk_', () => {
    const res = authError(reqWith({ 'x-api-key': 'nope' }));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('allows a valid sk_test_ bearer token (dev fallback)', () => {
    expect(authError(reqWith({ authorization: 'Bearer sk_test_dev123' }))).toBeNull();
  });

  it('accepts a lowercase "bearer" scheme (case-insensitive)', () => {
    expect(authError(reqWith({ authorization: 'bearer sk_test_1' }))).toBeNull();
  });

  it('trims surrounding whitespace around the bearer token', () => {
    expect(authError(reqWith({ authorization: 'Bearer    sk_test_padded   ' }))).toBeNull();
  });

  it('allows a valid sk_test_ via the x-api-key header', () => {
    expect(authError(reqWith({ 'x-api-key': 'sk_test_xkey' }))).toBeNull();
  });

  it('falls back to x-api-key when Authorization is not a bearer scheme', () => {
    // "Token ..." is not a bearer header → it reads x-api-key instead.
    expect(authError(reqWith({ authorization: 'Token zzz', 'x-api-key': 'sk_test_ok' }))).toBeNull();
    expect(authError(reqWith({ authorization: 'Token zzz' }))).not.toBeNull();
  });

  it('rejects sk_live_ tokens without a matching stored hash', () => {
    expect(authError(reqWith({ authorization: 'Bearer sk_live_unknown' }))).not.toBeNull();
  });
});

describe('json — success envelope', () => {
  it('wraps the payload as { data } with a 200 default status', async () => {
    const res = json({ hello: 'world' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { hello: 'world' } });
  });

  it('honours a custom status from ResponseInit', async () => {
    const res = json([1, 2, 3], { status: 201 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ data: [1, 2, 3] });
  });
});

describe('apiError — error envelope', () => {
  it('shapes { error: { code, message } } with the given status', async () => {
    const res = apiError('not_found', 'missing', 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: { code: 'not_found', message: 'missing' } });
  });
});
