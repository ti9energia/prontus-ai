'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ReceiptText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Banknote,
  ShieldAlert,
  RotateCcw,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  billingStats,
  glossReasons,
  glossTimeSeries,
  listGuides,
  getGuide,
  getPatient,
  resubmitGuide,
} from '@/lib/data';
import { diagnoseGuide } from '@/lib/mari';
import type { GuideStatus } from '@/lib/types';
import { openTab } from '@/lib/workspace';
import { ScreenContainer, ScreenHeader, StatCard, Table, Th, Td } from './_kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress, EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatCurrency, formatPercent } from '@/lib/utils';

const STATUS_TONE: Record<GuideStatus, React.ComponentProps<typeof Badge>['tone']> = {
  paid: 'success',
  sent: 'info',
  glossed: 'danger',
  draft: 'neutral',
};

export function BillingScreen({ paneId }: { paneId: string }) {
  const t = useTranslations('billing');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [, force] = React.useReducer((x) => x + 1, 0);

  const stats = billingStats();
  const reasons = glossReasons();
  const series = glossTimeSeries();
  const guides = listGuides();

  const sorted = React.useMemo(
    () =>
      [...guides].sort((a, b) => {
        // glossed first (actionable), then by recency
        const rank = (s: GuideStatus) => (s === 'glossed' ? 0 : s === 'sent' ? 1 : s === 'paid' ? 2 : 3);
        const d = rank(a.status) - rank(b.status);
        return d !== 0 ? d : a.createdAt < b.createdAt ? 1 : -1;
      }),
    [guides],
  );

  const maxReason = React.useMemo(
    () => reasons.reduce((m, r) => Math.max(m, r.value), 0) || 1,
    [reasons],
  );

  const glossedCount = stats.glossed;

  // Mari's safety gate: never resubmit a guide that would just be denied again.
  const onResubmit = (gid: string) => {
    const guide = getGuide(gid);
    if (guide && !diagnoseGuide(guide).recoverable) {
      toast.error(t('resubmitBlocked'));
      return;
    }
    resubmitGuide(gid);
    force();
    toast.success(t('guideStatus.sent'));
  };

  return (
    <ScreenContainer>
      <ScreenHeader icon={ReceiptText} title={t('title')} subtitle={t('subtitle')} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label={t('stats.submitted')} value={stats.submitted} icon={Send} tone="brand" />
        <StatCard label={t('stats.paid')} value={stats.paid} icon={CheckCircle2} tone="success" />
        <StatCard label={t('stats.glossed')} value={stats.glossed} icon={AlertTriangle} tone="danger" />
        <StatCard
          label={t('stats.glossRate')}
          value={formatPercent(stats.glossRate, locale)}
          icon={Percent}
          tone="warning"
        />
        <StatCard
          label={t('stats.recovered')}
          value={formatCurrency(stats.recovered, locale, stats.currency)}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label={t('stats.atRisk')}
          value={formatCurrency(stats.atRisk, locale, stats.currency)}
          icon={ShieldAlert}
          tone="danger"
        />
      </div>

      {/* agent nudge */}
      {glossedCount > 0 && (
        <button
          onClick={() => openTab('agent', undefined, { paneId })}
          className="group mt-5 flex w-full items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-600/[0.06] px-4 py-3 text-left transition-colors hover:bg-brand-600/[0.1]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600/15 text-brand-600">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <p className="flex-1 text-sm text-ink/90">{t('agentRecover', { count: glossedCount })}</p>
          <ChevronRight className="h-4 w-4 text-brand-600 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* charts */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('chart.title')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-before" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-after" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(148 163 184 / .15)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                  stroke="rgb(148 163 184)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                  stroke="rgb(148 163 184)"
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(148 163 184 / .3)', strokeWidth: 1 }}
                  contentStyle={{
                    background: 'rgb(16 22 33)',
                    border: '1px solid rgba(148,163,184,.2)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,.6)', marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="before"
                  name={t('chart.before')}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="url(#grad-before)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="after"
                  name={t('chart.after')}
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="url(#grad-after)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
              <LegendDot color="#94a3b8" label={t('chart.before')} />
              <LegendDot color="#0d9488" label={t('chart.after')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('glossReasons.title')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ul className="flex flex-col gap-4">
              {reasons.map((r) => (
                <li key={r.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-ink/90">{t(`glossReasons.${r.key}` as never)}</span>
                    <span className="shrink-0 font-display text-sm font-semibold tnum text-muted">
                      {r.value}
                    </span>
                  </div>
                  <Progress value={(r.value / maxReason) * 100} tone="danger" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* guides table */}
      <div className="mt-6">
        {sorted.length === 0 ? (
          <EmptyState icon={<ReceiptText className="h-6 w-6" />} title={tc('states.empty')} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('columns.guide')}</Th>
                <Th>{t('columns.patient')}</Th>
                <Th>{t('columns.payer')}</Th>
                <Th className="text-right">{t('columns.value')}</Th>
                <Th>{t('columns.status')}</Th>
                <Th>{t('columns.reason')}</Th>
                <Th className="text-right">{t('columns.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((g) => {
                const p = getPatient(g.patientId);
                return (
                  <tr key={g.id} className="transition-colors hover:bg-ink/[0.02]">
                    <Td className="font-mono text-xs text-muted">{g.id}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        {p ? (
                          <>
                            <Avatar name={p.name} hue={p.hue} size={30} />
                            <span className="truncate font-medium">{p.name}</span>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{g.payer}</Td>
                    <Td className="whitespace-nowrap text-right font-medium tnum">
                      {formatCurrency(g.value, locale, g.currency)}
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[g.status]} dot>
                        {t(`guideStatus.${g.status}` as never)}
                      </Badge>
                    </Td>
                    <Td className="text-sm text-muted">
                      {g.status === 'glossed' && g.glossReasonKey
                        ? t(`glossReasons.${g.glossReasonKey}` as never)
                        : '—'}
                    </Td>
                    <Td className="text-right">
                      {g.status === 'glossed' ? (
                        <Button
                          size="sm"
                          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                          onClick={() => onResubmit(g.id)}
                        >
                          {t('resubmit')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<FileText className="h-3.5 w-3.5" />}
                          onClick={() => openTab('tiss', { id: g.encounterId }, { paneId })}
                        >
                          {t('viewGuide')}
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </ScreenContainer>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
