import { describe, it, expect } from 'vitest';
import { paginate, jsonPage, DEFAULT_LIMIT, MAX_LIMIT } from '../pagination';

const req = (query = '') => new Request(`http://localhost/api/v1/things${query}`);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('paginate', () => {
  it('defaults to the first DEFAULT_LIMIT items at offset 0', () => {
    const page = paginate(req(), range(500));
    expect(page.offset).toBe(0);
    expect(page.limit).toBe(DEFAULT_LIMIT);
    expect(page.items).toHaveLength(DEFAULT_LIMIT);
    expect(page.items[0]).toBe(0);
    expect(page.total).toBe(500);
    expect(page.hasMore).toBe(true);
  });

  it('honors an explicit limit and offset', () => {
    const page = paginate(req('?limit=10&offset=20'), range(100));
    expect(page.limit).toBe(10);
    expect(page.offset).toBe(20);
    expect(page.items).toEqual(range(100).slice(20, 30));
    expect(page.hasMore).toBe(true);
  });

  it('clamps limit to MAX_LIMIT', () => {
    const page = paginate(req(`?limit=99999`), range(1000));
    expect(page.limit).toBe(MAX_LIMIT);
    expect(page.items).toHaveLength(MAX_LIMIT);
  });

  it('falls back to defaults for garbage/negative params', () => {
    for (const q of ['?limit=abc&offset=-5', '?limit=0', '?limit=-1', '?offset=notanumber']) {
      const page = paginate(req(q), range(80));
      expect(page.limit).toBe(DEFAULT_LIMIT);
      expect(page.offset).toBe(0);
    }
  });

  it('reports hasMore=false on the last page', () => {
    const page = paginate(req('?limit=50&offset=50'), range(80));
    expect(page.items).toHaveLength(30);
    expect(page.hasMore).toBe(false);
  });

  it('handles an offset past the end (empty page, not an error)', () => {
    const page = paginate(req('?offset=999'), range(10));
    expect(page.items).toEqual([]);
    expect(page.total).toBe(10);
    expect(page.hasMore).toBe(false);
  });

  it('handles an empty collection', () => {
    const page = paginate(req(), []);
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.hasMore).toBe(false);
  });
});

describe('jsonPage', () => {
  it('wraps items in { data, pagination } and passes through init', async () => {
    const page = paginate(req('?limit=2'), range(10));
    const res = jsonPage(page, { status: 200 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([0, 1]);
    expect(body.pagination).toEqual({ limit: 2, offset: 0, total: 10, hasMore: true });
  });
});
