'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import {
  BarChart3,
  Stethoscope,
  Banknote,
  Timer,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { listEncounters, billingStats, getCurrentUser } from '@/lib/data/store';
import { ScreenContainer, ScreenHeader, StatCard } from './_kit';
import { Card } from '@/components/ui/card';
import { Avatar, SegmentedControl } from '@/components/ui/misc';
import { formatCurrency, formatNumber, formatPercent, formatDate } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 * Relatórios (BI / Analytics) — productivity, revenue and quality.
 * Anchored on the live store (avg ticket, minutes saved, specialty mix,
 * the signed-in doctor) and projected across the selected period with a
 * deterministic, seeded model so toggling 7d/30d/90d is stable.
 * ------------------------------------------------------------------ */

type Period = '7d' | '30d' | '90d';

const PERIOD_CFG: Record<Period, { days: number; buckets: number; bucketDays: number }> = {
  '7d': { days: 7, buckets: 7, bucketDays: 1 },
  '30d': { days: 30, buckets: 10, bucketDays: 3 },
  '90d': { days: 90, buckets: 13, bucketDays: 7 },
};

const GROWTH: Record<Period, number> = { '7d': 0.08, '30d': 0.15, '90d': 0.23 };
const AI_USAGE: Record<Period, number> = { '7d': 0.88, '30d': 0.91, '90d': 0.93 };

const RANK_DOCTORS: Array<{ name: string; specialty: string; weight: number }> = [
  { name: 'Dra. Helena Vasconcelos', specialty: 'clinica', weight: 0.27 },
  { name: 'Dr. Rafael Andrade', specialty: 'cardio', weight: 0.22 },
  { name: 'Dra. Camila Becker', specialty: 'dermato', weight: 0.19 },
  { name: 'Dr. Thiago Moraes', specialty: 'ortopedia', weight: 0.17 },
  { name: 'Dra. Patrícia Lemos', specialty: 'pediatria', weight: 0.15 },
];

const SPECIALTY_LABEL: Record<string, [string, string, string, string]> = {
  clinica: ['Clínica', 'Internal', '内科', 'Médecine'],
  cardio: ['Cardio', 'Cardio', '心内科', 'Cardio'],
  dermato: ['Derma', 'Derma', '皮肤科', 'Dermato'],
  ortopedia: ['Ortopedia', 'Ortho', '骨科', 'Orthopédie'],
  pediatria: ['Pediatria', 'Pediatrics', '儿科', 'Pédiatrie'],
  gineco: ['Gineco', 'Gyneco', '妇科', 'Gynéco'],
};

function specialtyLabel(locale: string, key: string): string {
  const m = SPECIALTY_LABEL[key];
  if (!m) return key;
  return locale === 'en' ? m[1] : locale === 'zh-CN' ? m[2] : locale === 'fr-FR' ? m[3] : m[0];
}

/* Deterministic PRNG so the series stays stable across re-renders. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'rgb(16 22 33)',
  border: '1px solid rgba(148,163,184,.2)',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
};
const TOOLTIP_LABEL_STYLE: React.CSSProperties = { color: 'rgba(255,255,255,.6)', marginBottom: 4 };

export function ReportsScreen() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const [period, setPeriod] = React.useState<Period>('30d');

  const report = React.useMemo(() => {
    const cfg = PERIOD_CFG[period];
    const rand = seeded(cfg.days);
    const stats = billingStats();
    const encounters = listEncounters();

    // Real anchors pulled from the store.
    const avgTicket = Math.round(stats.recovered / Math.max(1, stats.paid)) || 220;
    const withSaved = encounters.filter((e) => e.minutesSaved);
    const avgMin = withSaved.length
      ? Math.round(withSaved.reduce((s, e) => s + (e.minutesSaved ?? 0), 0) / withSaved.length)
      : 14;
    const dailyConsultas = 12;

    // Revenue + consultas series, one point per bucket.
    const today = new Date();
    const revenue: Array<{ label: string; receita: number; consultas: number }> = [];
    let totalConsultas = 0;
    let totalReceita = 0;
    for (let i = 0; i < cfg.buckets; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (cfg.buckets - 1 - i) * cfg.bucketDays);
      const consultas = Math.round(dailyConsultas * cfg.bucketDays * (0.82 + rand() * 0.45));
      const receita = Math.round(consultas * avgTicket * (0.88 + rand() * 0.26));
      totalConsultas += consultas;
      totalReceita += receita;
      revenue.push({
        label:
          cfg.bucketDays === 1
            ? formatDate(d, locale, { weekday: 'short' })
            : formatDate(d, locale, { day: '2-digit', month: 'short' }),
        receita,
        consultas,
      });
    }

    // Specialty distribution — shape comes from real store encounters, scaled to the total.
    const specCount: Record<string, number> = {};
    for (const e of encounters) specCount[e.specialtyKey] = (specCount[e.specialtyKey] ?? 0) + 1;
    const specEntries = Object.entries(specCount).sort((a, b) => b[1] - a[1]);
    const specTotal = specEntries.reduce((s, [, v]) => s + v, 0) || 1;
    const bySpecialty = specEntries.map(([key, w]) => ({
      key,
      label: specialtyLabel(locale, key),
      value: Math.max(1, Math.round((totalConsultas * w) / specTotal)),
    }));

    // KPIs.
    const perDay = Math.round(totalConsultas / cfg.days);
    const hours = Math.round((totalConsultas * avgMin) / 60);
    const guias = Math.round(totalConsultas * 0.92);
    const glosasEvitadas = Math.round(guias * 0.11);
    const aiUsage = AI_USAGE[period];

    // Doctor ranking — top slot tracks the signed-in clinician.
    const user = getCurrentUser();
    const ranking = RANK_DOCTORS.map((doc, i) => {
      const name = i === 0 ? user.name : doc.name;
      return {
        name,
        specialty: doc.specialty,
        consultas: Math.max(1, Math.round(totalConsultas * doc.weight)),
        hue: (name.charCodeAt(0) * 9 + name.length * 13) % 360,
      };
    }).sort((a, b) => b.consultas - a.consultas);

    return {
      revenue,
      bySpecialty,
      ranking,
      totalConsultas,
      totalReceita,
      perDay,
      hours,
      guias,
      glosasEvitadas,
      aiUsage,
      avgTicket,
    };
  }, [period, locale]);

  const maxRank = report.ranking[0]?.consultas || 1;

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={BarChart3}
        title={L('Relatórios', 'Reports', '报告', 'Rapports')}
        subtitle={L(
          'Visão analítica da clínica — produtividade, receita e qualidade ao longo do período.',
          'Clinic analytics — productivity, revenue and quality across the period.',
          '诊所分析 — 所选周期内的生产力、收入与质量。',
          'Analytique de la clinique — productivité, revenus et qualité sur la période.',
        )}
        actions={
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7d', label: L('7 dias', '7 days', '7天', '7 j') },
              { value: '30d', label: L('30 dias', '30 days', '30天', '30 j') },
              { value: '90d', label: L('90 dias', '90 days', '90天', '90 j') },
            ]}
          />
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard
          label={L('Consultas', 'Consultations', '就诊量', 'Consultations')}
          value={formatNumber(report.totalConsultas, locale)}
          sub={`${report.perDay} ${L('/dia', '/day', '/天', '/jour')}`}
          icon={Stethoscope}
          tone="brand"
        />
        <StatCard
          label={L('Receita gerada', 'Revenue', '营收', 'Revenus')}
          value={formatCurrency(report.totalReceita, locale, 'BRL')}
          sub={`+${formatPercent(GROWTH[period], locale, 0)}`}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label={L('Tempo economizado', 'Time saved', '节省时间', 'Temps gagné')}
          value={`${report.hours}h`}
          sub={L('com a IA', 'with AI', '借助 AI', 'avec l’IA')}
          icon={Timer}
          tone="accent"
        />
        <StatCard
          label={L('Guias emitidas', 'Claims issued', '已出具单据', 'Feuilles émises')}
          value={formatNumber(report.guias, locale)}
          sub={L('enviadas ao convênio', 'sent to payers', '已提交至支付方', 'envoyées aux payeurs')}
          icon={FileCheck2}
          tone="neutral"
        />
        <StatCard
          label={L('Glosas evitadas', 'Denials avoided', '避免拒付', 'Rejets évités')}
          value={formatNumber(report.glosasEvitadas, locale)}
          sub={formatCurrency(report.glosasEvitadas * report.avgTicket, locale, 'BRL')}
          icon={ShieldCheck}
          tone="warning"
        />
        <StatCard
          label={L('Uso da IA', 'AI usage', 'AI 使用率', 'Usage IA')}
          value={formatPercent(report.aiUsage, locale, 0)}
          sub={L('das notas geradas', 'of generated notes', '的病历由 AI 生成', 'des notes générées')}
          icon={Sparkles}
          tone="brand"
        />
      </div>

      {/* Revenue over the period */}
      <Card className="mt-5 p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight">
              {L('Receita gerada', 'Revenue generated', '营收', 'Revenus générés')}
            </h3>
            <p className="mt-1 font-display text-2xl font-bold tnum">
              {formatCurrency(report.totalReceita, locale, 'BRL')}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success-fg dark:text-success">
            +{formatPercent(GROWTH[period], locale, 0)}
          </span>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={report.revenue} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14c8c4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14c8c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(148 163 184 / .15)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                stroke="rgb(148 163 184)"
                axisLine={false}
                tickLine={false}
                minTickGap={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                stroke="rgb(148 163 184)"
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => formatCurrency(Number(v), locale, 'BRL')}
              />
              <Tooltip
                cursor={{ stroke: 'rgb(148 163 184 / .3)', strokeWidth: 1 }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                formatter={(v: number) => [
                  formatCurrency(v, locale, 'BRL'),
                  L('Receita', 'Revenue', '营收', 'Revenus'),
                ]}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="#14c8c4"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Specialty mix + doctor ranking */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-base font-semibold tracking-tight">
            {L('Consultas por especialidade', 'Consultations by specialty', '按专科就诊量', 'Consultations par spécialité')}
          </h3>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.bySpecialty} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#14c8c4" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(148 163 184 / .15)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                  stroke="rgb(148 163 184)"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                  stroke="rgb(148 163 184)"
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(148 163 184 / .08)' }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  formatter={(v: number) => [
                    formatNumber(v, locale),
                    L('Consultas', 'Consultations', '就诊量', 'Consultations'),
                  ]}
                />
                <Bar dataKey="value" fill="url(#specGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base font-semibold tracking-tight">
            {L('Ranking de médicos', 'Doctor ranking', '医生排名', 'Classement des médecins')}
          </h3>
          <p className="mt-1 text-2xs text-muted">
            {L('Por produtividade no período', 'By productivity in the period', '按周期内的生产力', 'Par productivité sur la période')}
          </p>
          <ul className="mt-4 flex flex-col gap-3.5">
            {report.ranking.map((doc, i) => (
              <li key={doc.name} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-center font-display text-sm font-bold tnum text-subtle">
                  {i + 1}
                </span>
                <Avatar name={doc.name} hue={doc.hue} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{doc.name}</span>
                    <span className="shrink-0 font-display text-sm font-semibold tnum">
                      {formatNumber(doc.consultas, locale)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="truncate text-2xs text-muted">{specialtyLabel(locale, doc.specialty)}</span>
                    <div className="ml-auto h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-ink/[0.06] sm:w-32">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(doc.consultas / maxRank) * 100}%`,
                          background: 'linear-gradient(90deg,#14c8c4,#22d3ee)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </ScreenContainer>
  );
}
