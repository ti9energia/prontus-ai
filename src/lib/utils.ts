import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map a next-intl locale to an Intl BCP-47 tag. */
export function intlLocale(locale: string): string {
  return locale; // our locales are already valid BCP-47 tags
}

/** Format a number with locale-aware grouping. */
export function formatNumber(value: number, locale: string, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale(locale), opts).format(value);
}

/** Compact number, e.g. 12.4k. */
export function formatCompact(value: number, locale: string) {
  return new Intl.NumberFormat(intlLocale(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Currency formatter — the data carries its own currency code. */
export function formatCurrency(value: number, locale: string, currency = 'BRL') {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Percentage with one decimal. */
export function formatPercent(value: number, locale: string, fractionDigits = 1) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Time HH:mm in the user's locale. */
export function formatTime(date: Date | string, locale: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Medium date, e.g. "24 de jun." */
export function formatDate(date: Date | string, locale: string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    intlLocale(locale),
    opts ?? { day: '2-digit', month: 'short' },
  ).format(d);
}

/** Long, friendly date for headers. */
export function formatLongDate(date: Date | string, locale: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/** Seconds → mm:ss clock. */
export function clock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/** Relative "x min ago" using Intl.RelativeTimeFormat. */
export function timeAgo(date: Date | string, locale: string, now = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = (d.getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

/** Deterministic initials from a name. */
export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Sleep helper for simulated streaming. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp. */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
