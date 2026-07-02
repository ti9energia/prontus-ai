import { authError, jsonPage, paginate } from '@/lib/api';
import { listEncounters } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/encounters — paginated encounter list (`?limit=&offset=`). */
export function GET(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;
  return jsonPage(paginate(req, listEncounters()));
}
