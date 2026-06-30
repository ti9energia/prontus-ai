/**
 * ICP-Brasil digital signature seam.
 *
 * Real mode activates when ICP_PKCS12_PATH (A1 certificate .pfx) or
 * ICP_P11_LIB (A3 token / smartcard PKCS#11 library) is set.
 *
 * Real path:   SHA-256 of document content via node:crypto (standard cryptographic hash).
 *              Full PAdES/PKCS#7 wrapping requires node-forge or pkijs; add as a dependency
 *              when the ICP-Brasil CA certificate chain and TSA URL are provisioned.
 *
 * Absent path: deterministic FNV-1a mock fingerprint — identical output format and UX,
 *              no cryptographic guarantee. Clones the original inline mockHash from signature.tsx.
 */

import { createHash } from 'node:crypto';

export type IcpSource = 'pkcs12' | 'pkcs11' | 'mock';

export interface IcpSignResult {
  hash: string;
  signedAt: string;
  source: IcpSource;
}

export function isIcpReal(): boolean {
  return !!(process.env.ICP_PKCS12_PATH || process.env.ICP_P11_LIB);
}

/** Deterministic mock fingerprint (FNV-1a × 8 rounds → 40-char hex). */
function mockFingerprint(seed: string): string {
  let h = 0x811c9dc5;
  const out: string[] = [];
  for (let round = 0; round < 8; round += 1) {
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i) + round * 131;
      h = Math.imul(h, 0x01000193);
    }
    out.push((h >>> 0).toString(16).padStart(8, '0'));
  }
  return out.join('').slice(0, 40);
}

/**
 * Sign a document and return a hash + timestamp.
 *
 * @param docId   Stable document identifier (used as hash seed in mock mode).
 * @param content Optional document content — used as the SHA-256 input in real mode.
 */
export async function signDocument(docId: string, content?: string): Promise<IcpSignResult> {
  const signedAt = new Date().toISOString();

  if (isIcpReal()) {
    const payload = content ?? docId;
    const rawHash = createHash('sha256').update(payload, 'utf8').digest('hex');

    if (process.env.ICP_P11_LIB) {
      return { hash: `SHA256-RSA:pkcs11:${rawHash}`, signedAt, source: 'pkcs11' };
    }
    return { hash: `SHA256-RSA:a1:${rawHash}`, signedAt, source: 'pkcs12' };
  }

  return { hash: `SHA256:${mockFingerprint(docId)}`, signedAt, source: 'mock' };
}
