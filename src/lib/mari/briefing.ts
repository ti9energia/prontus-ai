import { ownerInsights } from '@/lib/data/store';

export interface BriefingPoint {
  kind: 'risk' | 'opportunity' | 'metric';
  title: string;
  detail: string;
}

/**
 * Builds the owner's "Mari reunião" briefing deck from live tenant insights — the
 * risks, upsells and trials Mari would open the meeting with, plus the headline
 * metrics. Pure read over the store, so it's testable and reusable by the console.
 */
export function ownerBriefing(locale = 'pt-BR'): BriefingPoint[] {
  const en = locale.startsWith('en');
  const L = (pt: string, eng: string) => (en ? eng : pt);
  const ins = ownerInsights();
  const points: BriefingPoint[] = [];

  if (ins.atRisk.length) {
    points.push({
      kind: 'risk',
      title: L(`${ins.atRisk.length} contas em risco`, `${ins.atRisk.length} accounts at risk`),
      detail: ins.atRisk.map((t) => t.name).join(', '),
    });
  }
  if (ins.upsell.length) {
    points.push({
      kind: 'opportunity',
      title: L(`${ins.upsell.length} oportunidades de upsell`, `${ins.upsell.length} upsell opportunities`),
      detail: ins.upsell.map((t) => t.name).join(', '),
    });
  }
  if (ins.trials.length) {
    points.push({
      kind: 'opportunity',
      title: L(`${ins.trials.length} trials para converter`, `${ins.trials.length} trials to convert`),
      detail: ins.trials.map((t) => t.name).join(', '),
    });
  }
  points.push({
    kind: 'metric',
    title: L('MRR e crescimento', 'MRR & growth'),
    detail: L(
      `MRR ${ins.stats.mrr} · +${Math.round(ins.stats.mrrGrowth * 100)}% · churn ${Math.round(ins.stats.churn * 100)}%`,
      `MRR ${ins.stats.mrr} · +${Math.round(ins.stats.mrrGrowth * 100)}% · churn ${Math.round(ins.stats.churn * 100)}%`,
    ),
  });
  return points;
}
