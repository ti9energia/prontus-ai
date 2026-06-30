import { createHash } from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authError } from '../api/auth';
import * as dataModule from '../data';

function makeReq(token: string | null, header: 'auth' | 'xkey' = 'auth'): Request {
  const headers: Record<string, string> = {};
  if (token !== null) {
    if (header === 'auth') headers['authorization'] = `Bearer ${token}`;
    else headers['x-api-key'] = token;
  }
  return new Request('http://localhost/api/v1/test', { headers });
}

describe('authError — missing token', () => {
  it('returns 401 when no authorization header', () => {
    const res = authError(makeReq(null));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('returns 401 when authorization header is empty', () => {
    const req = new Request('http://localhost/api/v1/test', {
      headers: { authorization: '' },
    });
    const res = authError(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });
});

describe('authError — dev fallback (NODE_ENV=test)', () => {
  it('accepts sk_test_* tokens without DB lookup in non-production', () => {
    const res = authError(makeReq('sk_test_auronis_dev'));
    expect(res).toBeNull();
  });

  it('rejects sk_live_* tokens that are not in the store', () => {
    const res = authError(makeReq('sk_live_unknown_key_abc'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });
});

describe('authError — production hash lookup', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects sk_test_* tokens in production', () => {
    const res = authError(makeReq('sk_test_should_fail'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('accepts a token whose SHA-256 hash matches a non-revoked stored key', () => {
    const rawKey = 'sk_live_test_key_for_prod_check';
    const hash = createHash('sha256').update(rawKey).digest('hex');
    vi.spyOn(dataModule, 'getApiKeyByHash').mockReturnValue({
      id: 'key_001',
      orgId: 'ten_0001',
      name: 'Test key',
      prefix: 'sk_live_',
      hash,
      createdAt: new Date().toISOString(),
    });

    const res = authError(makeReq(rawKey));
    expect(res).toBeNull();
  });

  it('rejects a revoked key', () => {
    const rawKey = 'sk_live_revoked_key';
    const hash = createHash('sha256').update(rawKey).digest('hex');
    vi.spyOn(dataModule, 'getApiKeyByHash').mockReturnValue({
      id: 'key_002',
      orgId: 'ten_0001',
      name: 'Revoked key',
      prefix: 'sk_live_',
      hash,
      createdAt: new Date().toISOString(),
      revokedAt: new Date().toISOString(),
    });

    const res = authError(makeReq(rawKey));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('rejects a token whose hash has no stored record', () => {
    vi.spyOn(dataModule, 'getApiKeyByHash').mockReturnValue(undefined);
    const res = authError(makeReq('sk_live_not_in_store'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });
});

describe('authError — x-api-key header', () => {
  it('accepts sk_test_* via x-api-key in dev', () => {
    const res = authError(makeReq('sk_test_via_xkey', 'xkey'));
    expect(res).toBeNull();
  });

  it('rejects missing x-api-key', () => {
    const req = new Request('http://localhost/api/v1/test', {
      headers: { 'x-api-key': '' },
    });
    expect(authError(req)).not.toBeNull();
  });
});

describe('store — listApiKeys / getApiKeyByHash / revokeApiKey', () => {
  it('seeds a dev key', () => {
    const keys = dataModule.listApiKeys('ten_0001');
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(keys[0].prefix).toBe('sk_test_');
  });

  it('finds a key by the seeded hash', () => {
    const DEV_KEY_HASH = 'a3e4f9a2b7c8d1e5f6a4b3c2d9e8f7a1b0c5d4e3f2a1b9c8d7e6f5a4b3c2d1';
    const found = dataModule.getApiKeyByHash(DEV_KEY_HASH);
    expect(found).toBeDefined();
    expect(found!.orgId).toBe('ten_0001');
  });

  it('returns undefined for unknown hash', () => {
    expect(dataModule.getApiKeyByHash('deadbeef')).toBeUndefined();
  });

  it('revokeApiKey sets revokedAt', () => {
    const keys = dataModule.listApiKeys('ten_0001');
    const id = keys[0].id;
    const revoked = dataModule.revokeApiKey(id);
    expect(revoked?.revokedAt).toBeDefined();
  });
});
