import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { listPatients } from '@/lib/data';

// NODE_ENV=test → the sk_test_* dev-key bypass in lib/api/auth accepts this.
const authed = (query = '') =>
  new Request(`http://localhost/api/v1/patients${query}`, {
    headers: { authorization: 'Bearer sk_test_auronis_dev' },
  });

describe('GET /api/v1/patients — paginated', () => {
  it('rejects without an API key (401)', async () => {
    const res = await GET(new Request('http://localhost/api/v1/patients'));
    expect(res.status).toBe(401);
  });

  it('returns a { data, pagination } envelope, not a bare array', async () => {
    const res = await GET(authed());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toMatchObject({
      limit: expect.any(Number),
      offset: expect.any(Number),
      total: listPatients().length,
      hasMore: expect.any(Boolean),
    });
  });

  it('bounds the page to the requested limit', async () => {
    const res = await GET(authed('?limit=1'));
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(1);
    expect(body.pagination.limit).toBe(1);
  });

  it('offset walks the collection', async () => {
    const all = (await (await GET(authed('?limit=200'))).json()).data;
    if (all.length >= 2) {
      const second = (await (await GET(authed('?limit=1&offset=1'))).json()).data;
      expect(second[0]).toEqual(all[1]);
    }
  });
});
