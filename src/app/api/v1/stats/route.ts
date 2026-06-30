import { authError, json } from '@/lib/api/auth';
import { billingStats, ownerInsights } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/stats — a billing + business summary rolled up from the store. */
export function GET(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  const billing = billingStats();
  const { stats, tenantCount, atRisk, trials, upsell } = ownerInsights();

  return json({
    billing,
    business: stats,
    tenants: {
      total: tenantCount,
      atRisk: atRisk.length,
      trials: trials.length,
      upsell: upsell.length,
    },
  });
}
