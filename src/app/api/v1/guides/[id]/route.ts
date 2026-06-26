import { apiError, authError, json } from '@/lib/api/auth';
import { getGuide } from '@/lib/data/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/guides/:id — a single TISS guide, or 404. */
export function GET(req: Request, { params }: { params: { id: string } }) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  const guide = getGuide(params.id);
  if (!guide) return apiError('not_found', `No guide with id '${params.id}'.`, 404);
  return json(guide);
}
