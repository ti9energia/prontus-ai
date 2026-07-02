'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Handshake, FileCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { PAYERS, getGuideTemplate, listGuides } from '@/lib/data';
import { openTab } from '@/lib/workspace';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

/** Deterministic hash so each payer's simulated trend is stable across renders. */
function hashOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return h;
}

/** 6-point gloss-rate trend ending at the payer's real current rate. */
function trendSeries(payer: string, currentRate: number): number[] {
  const h = hashOf(payer);
  const start = Math.min(0.35, currentRate + 0.08 + ((h % 7) / 100));
  const pts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const wobble = (((h * (i + 3)) % 11) - 5) / 400;
    pts.push(Math.max(0, start + (currentRate - start) * t + wobble * (1 - t)));
  }
  pts[pts.length - 1] = currentRate;
  return pts;
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 72;
  const h = 24;
  const max = Math.max(...points, 0.01);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * (w - 2) + 1;
      const y = h - 2 - ((p - min) / span) * (h - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn('shrink-0', className)}
      aria-hidden
      focusable="false"
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Per-payer contracts + the standard guide configured for each plan (Block 5b),
 *  reusing the per-payer guide templates from Block 2 and live gloss stats. */
export function ContratosScreen({ paneId }: { paneId: string }) {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const allGuides = listGuides();

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Handshake}
        title={L('Contratos', 'Contracts', '合同', 'Contrats')}
        subtitle={L(
          'Convênios, desempenho de glosa e a guia-padrão de cada plano de saúde.',
          'Payers, denial performance and the standard guide for each health plan.',
          '支付方、拒付表现与各健康计划的标准单据。',
          'Assureurs, performance de rejet et feuille standard de chaque plan.',
        )}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYERS.map((payer) => {
          const tpl = getGuideTemplate(payer);
          const procs = tpl?.procedures ?? [];
          const total = procs.reduce((s, p) => s + p.value * p.qty, 0);

          // Live per-payer stats from the store.
          const payerGuides = allGuides.filter((g) => g.payer === payer);
          const submitted = payerGuides.filter((g) => g.status !== 'draft');
          const glossed = submitted.filter((g) => g.status === 'glossed');
          const glossRate = submitted.length ? glossed.length / submitted.length : 0;
          const ticket = payerGuides.length
            ? payerGuides.reduce((s, g) => s + g.value, 0) / payerGuides.length
            : total;
          const trend = trendSeries(payer, glossRate);
          const improving = trend[0] >= trend[trend.length - 1];
          const firstGuide = payerGuides[0];

          return (
            <Card key={payer} className="flex flex-col p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-medium">{payer}</p>
                <Badge tone="success" dot>
                  {L('Vigente', 'In force', '有效', 'En vigueur')}
                </Badge>
              </div>

              {/* payer KPIs */}
              <div className="mt-3 grid grid-cols-3 items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2.5">
                <div>
                  <p className="text-2xs font-medium uppercase tracking-wide text-subtle">
                    {L('Glosa', 'Denials', '拒付', 'Rejets')}
                  </p>
                  <p className="mt-0.5 font-display text-sm font-bold tnum">
                    {formatPercent(glossRate, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-medium uppercase tracking-wide text-subtle">
                    {L('Ticket médio', 'Avg ticket', '平均单价', 'Panier moyen')}
                  </p>
                  <p className="mt-0.5 font-display text-sm font-bold tnum">
                    {formatCurrency(ticket, locale, 'BRL')}
                  </p>
                </div>
                <div
                  className={cn(
                    'justify-self-end',
                    improving ? 'text-success-fg dark:text-success' : 'text-danger-fg dark:text-danger',
                  )}
                >
                  <p className="flex items-center justify-end gap-1 text-2xs font-medium uppercase tracking-wide">
                    {improving ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {L('Tendência', 'Trend', '趋势', 'Tendance')}
                  </p>
                  <Sparkline points={trend} className="mt-0.5" />
                  <span className="sr-only">
                    {improving
                      ? L('Taxa de glosa em queda', 'Denial rate falling', '拒付率下降', 'Taux de rejet en baisse')
                      : L('Taxa de glosa em alta', 'Denial rate rising', '拒付率上升', 'Taux de rejet en hausse')}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-2xs font-medium uppercase tracking-wide text-subtle">
                {L('Guia-padrão', 'Standard guide', '标准单据', 'Feuille standard')}
              </p>
              <ul className="mt-1.5 flex-1 space-y-1 text-sm text-muted">
                {procs.map((p) => (
                  <li key={p.code} className="flex items-center justify-between gap-3">
                    <span className="truncate">{p.description}</span>
                    <span className="tnum shrink-0">{formatCurrency(p.value, locale, 'BRL')}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-2.5">
                {firstGuide ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FileCheck className="h-3.5 w-3.5" />}
                    onClick={() => openTab('tiss', { id: firstGuide.id }, { paneId })}
                  >
                    {L('Abrir guia-padrão', 'Open standard guide', '打开标准单据', 'Ouvrir la feuille standard')}
                  </Button>
                ) : (
                  <span />
                )}
                <p className="text-right text-sm font-semibold tnum">{formatCurrency(total, locale, 'BRL')}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </ScreenContainer>
  );
}
