import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isIcpReal, signDocument } from '../connectors/icp';

describe('isIcpReal', () => {
  beforeEach(() => {
    delete process.env.ICP_PKCS12_PATH;
    delete process.env.ICP_P11_LIB;
  });

  it('returns false when no ICP env vars are set', () => {
    expect(isIcpReal()).toBe(false);
  });

  it('returns true when ICP_PKCS12_PATH is set', () => {
    process.env.ICP_PKCS12_PATH = '/path/to/cert.pfx';
    expect(isIcpReal()).toBe(true);
  });

  it('returns true when ICP_P11_LIB is set', () => {
    process.env.ICP_P11_LIB = '/usr/lib/libeToken.so';
    expect(isIcpReal()).toBe(true);
  });
});

describe('signDocument (mock mode)', () => {
  beforeEach(() => {
    delete process.env.ICP_PKCS12_PATH;
    delete process.env.ICP_P11_LIB;
  });

  it('returns mock source', async () => {
    const result = await signDocument('doc_001');
    expect(result.source).toBe('mock');
  });

  it('hash starts with SHA256:', async () => {
    const result = await signDocument('doc_001');
    expect(result.hash).toMatch(/^SHA256:[0-9a-f]{40}$/);
  });

  it('is deterministic for the same docId', async () => {
    const a = await signDocument('doc_abc');
    const b = await signDocument('doc_abc');
    expect(a.hash).toBe(b.hash);
  });

  it('produces different hashes for different docIds', async () => {
    const a = await signDocument('doc_001');
    const b = await signDocument('doc_002');
    expect(a.hash).not.toBe(b.hash);
  });

  it('includes signedAt timestamp', async () => {
    const before = new Date().toISOString();
    const result = await signDocument('doc_001');
    expect(result.signedAt >= before).toBe(true);
  });
});

describe('signDocument (real mode — PKCS12)', () => {
  afterEach(() => {
    delete process.env.ICP_PKCS12_PATH;
  });

  it('uses pkcs12 source when ICP_PKCS12_PATH set', async () => {
    process.env.ICP_PKCS12_PATH = '/fake/cert.pfx';
    const result = await signDocument('doc_001', 'document content here');
    expect(result.source).toBe('pkcs12');
  });

  it('hash starts with SHA256-RSA:a1:', async () => {
    process.env.ICP_PKCS12_PATH = '/fake/cert.pfx';
    const result = await signDocument('doc_001', 'content');
    expect(result.hash).toMatch(/^SHA256-RSA:a1:[0-9a-f]{64}$/);
  });

  it('hash is deterministic for same content', async () => {
    process.env.ICP_PKCS12_PATH = '/fake/cert.pfx';
    const a = await signDocument('doc_001', 'same content');
    const b = await signDocument('doc_002', 'same content');
    // same content → same SHA-256 hash body (regardless of docId in real mode)
    expect(a.hash.split(':')[2]).toBe(b.hash.split(':')[2]);
  });
});

describe('signDocument (real mode — PKCS11)', () => {
  afterEach(() => {
    delete process.env.ICP_P11_LIB;
  });

  it('uses pkcs11 source when ICP_P11_LIB set', async () => {
    process.env.ICP_P11_LIB = '/usr/lib/libeToken.so';
    const result = await signDocument('doc_001', 'content');
    expect(result.source).toBe('pkcs11');
  });

  it('hash starts with SHA256-RSA:pkcs11:', async () => {
    process.env.ICP_P11_LIB = '/usr/lib/libeToken.so';
    const result = await signDocument('doc_001', 'content');
    expect(result.hash).toMatch(/^SHA256-RSA:pkcs11:[0-9a-f]{64}$/);
  });
});
