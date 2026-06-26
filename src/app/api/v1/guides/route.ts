import { authError, json } from '@/lib/api/auth';
import { listGuides } from '@/lib/data/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/guides — list every TISS guide. */
export function GET(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;
  return json(listGuides());
}
