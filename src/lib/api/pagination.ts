import { NextResponse } from 'next/server';

/**
 * Offset pagination for the public v1 list endpoints. Before this, every list
 * route returned the ENTIRE collection — response size and server work grew
 * unbounded with the data. Now callers get a bounded page plus the metadata to
 * walk the rest (`?limit=&offset=`), which is table-stakes for a public REST API.
 *
 * Backward-compatible envelope: `data` stays the item array (existing readers
 * keep working, they just receive the first page); a `pagination` sibling
 * carries `limit/offset/total/hasMore`.
 */

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

/** Slices `all` per the request's `?limit=&offset=` (clamped to sane bounds). */
export function paginate<T>(req: Request, all: readonly T[]): Page<T> {
  const params = new URL(req.url).searchParams;

  const rawLimit = Number(params.get('limit'));
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), MAX_LIMIT) : DEFAULT_LIMIT;

  const rawOffset = Number(params.get('offset'));
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

  const items = all.slice(offset, offset + limit);
  return {
    items,
    limit,
    offset,
    total: all.length,
    hasMore: offset + items.length < all.length,
  };
}

/** Envelope for a paginated list: `{ data: T[], pagination: {...} }`. */
export function jsonPage<T>(page: Page<T>, init?: ResponseInit): NextResponse {
  return NextResponse.json(
    {
      data: page.items,
      pagination: {
        limit: page.limit,
        offset: page.offset,
        total: page.total,
        hasMore: page.hasMore,
      },
    },
    init,
  );
}
