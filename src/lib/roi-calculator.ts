import { planForDoctors } from '@/components/landing/plans-data';

export interface RoiInputs {
  doctors: number;
  consultsPerDay: number;
  ticketAvg: number;
  glossRate: number;
}

export interface RoiResults {
  billingGross: number;
  glossMonthly: number;
  recovery: number;
  timeSaved: number;
  plan: 'Starter' | 'Pro' | 'Scale';
  planPrice: number;
  daysToBreakEven: number;
}

/** Pure ROI projection shared by the landing and its regression tests. */
export function calcRoi(i: RoiInputs): RoiResults {
  const billingGross = i.doctors * i.consultsPerDay * 22 * i.ticketAvg;
  const glossMonthly = billingGross * (i.glossRate / 100);
  const recovery = Math.round(glossMonthly * 0.7);
  const timeSaved = Math.round(i.doctors * 1.8 * 22);
  const sized = planForDoctors(i.doctors);
  const plan = sized.name as RoiResults['plan'];
  const planPrice = sized.monthly;
  const daysToBreakEven = recovery > 0 ? Math.ceil(planPrice / (recovery / 22)) : 0;
  return { billingGross, glossMonthly, recovery, timeSaved, plan, planPrice, daysToBreakEven };
}
