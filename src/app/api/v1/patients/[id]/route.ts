import { apiError, authError, json } from '@/lib/api/auth';
import { getPatient } from '@/lib/data/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/patients/:id — a single patient, or 404. */
export function GET(req: Request, { params }: { params: { id: string } }) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  const patient = getPatient(params.id);
  if (!patient) return apiError('not_found', `No patient with id '${params.id}'.`, 404);
  return json(patient);
}
