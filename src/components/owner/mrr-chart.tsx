'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SeriesPoint } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

// Chart palette, resolved from the theme's CSS vars so it follows light/dark.
const CHART = {
  series: 'rgb(var(--ring))',
  grid: 'rgb(var(--subtle) / 0.18)',
  axis: 'rgb(var(--subtle) / 0.7)',
  tooltipBg: 'rgb(var(--card))',
  tooltipBorder: '1px solid rgb(var(--line) / 0.8)',
  tooltipText: 'rgb(var(--ink))',
};

/**
 * The owner Overview's MRR area chart. Split into its own module and loaded via
 * next/dynamic (ssr:false) from sections.tsx so recharts (~90KB) leaves the
 * initial /owner bundle and streams in after hydration behind a skeleton — the
 * KPIs and page shell paint immediately. See sections.tsx OverviewSection.
 */
export function MrrChart({
  series,
  locale,
  currency,
  label,
}: {
  series: SeriesPoint[];
  locale: string;
  currency: string;
  label: string;
}) {
  return (
    <div className="h-[260px] w-full" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.series} stopOpacity={0.4} />
              <stop offset="100%" stopColor={CHART.series} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={CHART.axis} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke={CHART.axis}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => formatCurrency(Number(v), locale, currency)}
          />
          <Tooltip
            contentStyle={{
              background: CHART.tooltipBg,
              border: CHART.tooltipBorder,
              borderRadius: 12,
              fontSize: 12,
              color: CHART.tooltipText,
            }}
            formatter={(v: number) => [formatCurrency(v, locale, currency), 'MRR']}
          />
          <Area type="monotone" dataKey="mrr" stroke={CHART.series} strokeWidth={2.5} fill="url(#mrrG)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
