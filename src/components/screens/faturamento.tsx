'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Banknote, RefreshCw, TrendingUp, AlertTriangle, ShieldCheck, Send } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { listGuides, billingStats, glossReasons, glossTimeSeries, resubmitGuide } from '@/lib/data';
import type { GuideStatus } from '@/lib/types';
import { ScreenContainer, ScreenHeader, StatCard, SectionTitle } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/misc';
import { Progress } from '@/components/ui/feedback';
import { MariEmptyState } from '@/components/brand/mari-empty-state';
import { mariEmptyLines } from '@/lib/mari';
import { toast } from '@/lib/toast';
import { formatCurrency, formatPercent } from '@/lib/utils';

const STATUS_TONE: Record<GuideStatus, React.ComponentProps<typeof Badge>['tone']> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  glossed: 'danger',
};

type Filter = 'all' | GuideStatus;

/** Billing-team queue across the whole org (Block 5) — distinct from the doctor's
 *  gloss dashboard: cross-doctor filters + one-click resubmit. */
export function FaturamentoScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('billing');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const [filter, setFilter] = React.useState<Filter>('all');
  const stats = billingStats();
  const reasons = glossReasons();
  const series = glossTimeSeries();
  const guides = listGuides().filter((g) => (filter === 'all' ? true : g.status === filter));

  const maxReason = React.useMemo(() => reasons.reduce((m, r) => Math.max(m, r.value), 0) || 1, [reasons]);
  const exposure = stats.recovered + stats.atRisk;
  const atRiskShare = exposure ? stats.atRisk / exposure : 0;

  const resub = (id: string) => {
    resubmitGuide(id);
    bump();
    toast.success(L('Guia reenviada', 'Claim resubmitted', '单据已重新提交', 'Feuille renvoyée'));
  };

  const flabel = (f: Filter) =>
    ({
      all: L('Todas', 'All', '全部', 'Toutes'),
      glossed: L('Glosadas', 'Denied', '被拒', 'Rejetées'),
      sent: L('Enviadas', 'Sent', '已发送', 'Envoyées'),
      paid: L('Pagas', 'Paid', '已支付', 'Payées'),
      draft: L('Rascunho', 'Draft', '草稿', 'Brouillon'),
    })[f];

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Banknote}
        title={L('Faturamento (equipe)', 'Billing (team)', '收费（团队）', 'Facturation (équipe)')}
        subtitle={L(
          'Fila de guias de toda a equipe — priorize reenvios e recupere glosas.',
          'Whole-team claim queue — prioritize resubmissions and recover denials.',
          '全团队单据队列——优先重新提交并追回拒付。',
          'File des feuilles de toute l’équipe — priorisez les renvois.',
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={L('Recuperado', 'Recovered', '已追回', 'Récupéré')} value={formatCurrency(stats.recovered, locale, 'BRL')} icon={TrendingUp} tone="success" />
        <StatCard label={L('Em risco', 'At risk', '风险中', 'À risque')} value={formatCurrency(stats.atRisk, locale, 'BRL')} icon={AlertTriangle} tone="danger" />
        <StatCard label={L('Taxa de glosa', 'Denial rate', '拒付率', 'Taux de rejet')} value={formatPercent(stats.glossRate, locale)} icon={ShieldCheck} tone="brand" />
        <StatCard label={L('Enviadas', 'Submitted', '已提交', 'Envoyées')} value={String(stats.submitted)} icon={Send} tone="brand" />
      </div>

      {/* value-at-risk bar */}
      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink/90">
            {L('Valor em risco', 'Value at risk', '风险金额', 'Valeur à risque')}
          </p>
          <p className="font-display text-sm font-semibold tnum">
            {formatCurrency(stats.atRisk, locale, 'BRL')}
            <span className="ml-1.5 text-2xs font-medium text-muted">
              {L('de', 'of', '/', 'sur')} {formatCurrency(exposure, locale, 'BRL')}
            </span>
          </p>
        </div>
        <Progress value={atRiskShare * 100} tone="danger" className="mt-2.5" />
        <p className="mt-1.5 text-2xs text-muted">
          {L(
            'Guias glosadas ainda não recuperadas, sobre o total transacionado.',
            'Denied claims not yet recovered, out of the total transacted.',
            '尚未追回的被拒单据占交易总额的比例。',
            'Feuilles rejetées non récupérées, sur le total traité.',
          )}
        </p>
      </Card>

      {/* gloss trend + reasons — same patterns as the doctor's billing dashboard */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle className="mb-2">{t('chart.title')}</SectionTitle>
          <div
            className="h-[140px] w-full"
            role="img"
            aria-label={`${t('chart.title')}: ${t('chart.before')} ${series[0]?.before ?? 0} → ${t('chart.after')} ${series[series.length - 1]?.after ?? 0}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="fat-grad-after" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'rgb(var(--subtle))' }}
                  stroke="rgb(var(--line))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(148 163 184 / .3)', strokeWidth: 1 }}
                  contentStyle={{
                    background: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--line))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'rgb(var(--ink))',
                  }}
                  labelStyle={{ color: 'rgb(var(--muted))', marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="before"
                  name={t('chart.before')}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="after"
                  name={t('chart.after')}
                  stroke="#0d9488"
                  strokeWidth={2}
                  fill="url(#fat-grad-after)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle className="mb-2">{t('glossReasons.title')}</SectionTitle>
          <ul className="flex flex-col gap-3">
            {reasons.map((r) => (
              <li key={r.key}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-ink/90">{t(`glossReasons.${r.key}` as never)}</span>
                  <span className="shrink-0 font-display text-sm font-semibold tnum text-muted">{r.value}</span>
                </div>
                <Progress value={(r.value / maxReason) * 100} tone="danger" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* queue */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <SectionTitle className="mb-0">{L('Fila de guias', 'Claim queue', '单据队列', 'File des feuilles')}</SectionTitle>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={(['all', 'glossed', 'sent', 'paid'] as Filter[]).map((f) => ({ value: f, label: flabel(f) }))}
        />
      </div>

      {guides.length === 0 ? (
        <MariEmptyState
          narration={mariEmptyLines(locale).billing}
          title={L('Nenhuma guia neste filtro', 'No claims match this filter', '此筛选下没有单据', 'Aucune feuille pour ce filtre')}
          description={L(
            'Ajuste o filtro para ver a fila completa da equipe.',
            'Adjust the filter to see the whole team queue.',
            '调整筛选以查看团队的完整队列。',
            'Ajustez le filtre pour voir toute la file de l’équipe.',
          )}
          action={
            filter !== 'all' ? (
              <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                {flabel('all')}
              </Button>
            ) : undefined
          }
          className="mt-3"
        />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {guides.map((g) => (
            <Card key={g.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {g.payer} · <span className="font-mono text-xs text-muted">{g.id}</span>
                </p>
                <p className="text-2xs text-muted tnum">{formatCurrency(g.value, locale, 'BRL')}</p>
              </div>
              <Badge tone={STATUS_TONE[g.status]} dot={g.status === 'glossed'}>
                {flabel(g.status)}
              </Badge>
              {g.status === 'glossed' && (
                <Button size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => resub(g.id)}>
                  {L('Reenviar', 'Resubmit', '重新提交', 'Renvoyer')}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
