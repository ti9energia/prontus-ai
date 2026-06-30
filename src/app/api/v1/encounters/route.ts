import { authError, json } from '@/lib/api/auth';
import { listEncounters } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/encounters — list every encounter. */
export function GET(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;
  return json(listEncounters());
}
