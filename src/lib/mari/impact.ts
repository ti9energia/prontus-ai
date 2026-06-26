/**
 * Auronis Impact — the value ledger.
 *
 * The market differentiator: most scribes sell "saved minutes". Auronis quantifies
 * *money* — revenue recovered, denials ("glosas") prevented vs a baseline, and the
 * value of hours returned — into one honest, transparent number per month. Pure
 * and testable; `impactFromStore()` wires it to live data for the UI and Mari.
 */

import { billingStats, listEncounters } from '@/lib/data/store';

export interface ImpactInput {
  glossRate: number; // current denial rate (0..1)
  submitted: number; // guides submitted this period
  recovered: number; // BRL already paid
  atRisk: number; // BRL sitting in denied guides (recoverable on resubmit)
  minutesSaved: number; // total minutes returned to the clinician
  avgGuideValue?: number; // BRL per guide
}

export interface ImpactResult {
  hoursReturned: number;
  recovered: number;
  atRisk: number;
  denialRateDelta: number; // baseline - current, as a 0..1 fraction
  preventedValue: number; // BRL of denials avoided vs baseline
  monthlyImpact: number; // BRL of total value generated this month
  currency: 'BRL';
}

// Transparent assumptions behind the value model (documented so it stays honest).
export const BASELINE_DENIAL_RATE = 0.18; // typical pre-Auronis denial rate
export const DOCTOR_HOUR_BRL = 250; // value of an hour of clinical time
const DEFAULT_GUIDE_VALUE = 180;

export function computeImpact(i: ImpactInput): ImpactResult {
  const avg = i.avgGuideValue && i.avgGuideValue > 0 ? i.avgGuideValue : DEFAULT_GUIDE_VALUE;
  const hoursReturned = Math.round((i.minutesSaved / 60) * 10) / 10;
  const denialRateDelta = Math.max(0, BASELINE_DENIAL_RATE - i.glossRate);
  const preventedValue = Math.round(denialRateDelta * i.submitted * avg);
  const timeValue = Math.round(hoursReturned * DOCTOR_HOUR_BRL);
  const monthlyImpact = Math.round(i.recovered + preventedValue + timeValue);
  return {
    hoursReturned,
    recovered: Math.round(i.recovered),
    atRisk: Math.round(i.atRisk),
    denialRateDelta,
    preventedValue,
    monthlyImpact,
    currency: 'BRL',
  };
}

/** Pull the live numbers from the store and compute the impact ledger. */
export function impactFromStore(): ImpactResult {
  const b = billingStats();
  const minutesSaved = listEncounters().reduce((s, e) => s + (e.minutesSaved ?? 0), 0);
  const avgGuideValue = b.paid > 0 ? b.recovered / b.paid : DEFAULT_GUIDE_VALUE;
  return computeImpact({
    glossRate: b.glossRate,
    submitted: b.submitted,
    recovered: b.recovered,
    atRisk: b.atRisk,
    minutesSaved,
    avgGuideValue,
  });
}
