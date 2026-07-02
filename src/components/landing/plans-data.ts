/**
 * Single source of truth for public plan pricing (BRL, per doctor/month).
 * Matches the database seed — every landing surface (pricing table, ROI
 * calculator, tests) must import from here instead of hardcoding numbers.
 */
export type PlanId = 'starter' | 'pro' | 'scale';

export interface PlanPricing {
  id: PlanId;
  /** Display name used in prose (ROI calculator, structured data…). */
  name: string;
  /** Price per doctor per month, in BRL. */
  monthly: number;
}

export const PLANS: readonly PlanPricing[] = [
  { id: 'starter', name: 'Starter', monthly: 99 },
  { id: 'pro', name: 'Pro', monthly: 199 },
  { id: 'scale', name: 'Scale', monthly: 349 },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<
  PlanId,
  PlanPricing
>;

// Re-exported for existing landing call sites — the formula itself lives in
// lib/utils.ts so the checkout backend can share it without importing a
// landing-only module (see lib/checkout — amount charged must match the
// price displayed here, not drift into a second copy of the math).
export { yearlyMonthlyPrice } from '@/lib/utils';

/** Which plan fits a clinic with N doctors (mirrors the sales sizing rule). */
export function planForDoctors(doctors: number): PlanPricing {
  return doctors <= 2 ? PLAN_BY_ID.starter : doctors <= 5 ? PLAN_BY_ID.pro : PLAN_BY_ID.scale;
}
