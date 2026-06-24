'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Play,
  Plus,
  Sparkles,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import {
  listEncounters,
  getPatient,
  getCurrentUser,
  agentRecommendations,
} from '@/lib/data/store';
import type { Encounter, EncounterStatus } from '@/lib/types';
import { openTab, type ScreenKey } from '@/lib/workspace/store';
import { ScreenContainer, ScreenHeader, StatCard } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/misc';
import { formatLongDate, formatTime, cn } from '@/lib/utils';

const STATUS_TONE: Record<EncounterStatus, React.ComponentProps<typeof Badge>['tone']> = {
  scheduled: 'neutral',
  recording: 'accent',
  draft: 'warning',
  review: 'info',
  finalized: 'success',
};

const TYPE_TONE: Record<string, React.ComponentProps<typeof Badge>['tone']> = {
  firstVisit: 'brand',
  followUp: 'neutral',
  urgent: 'danger',
  telemedicine: 'info',
};

export function TodayScreen({ paneId }: { paneId: string }) {
  const t = useTranslations('today');
  const ts = useTranslations('encounterStatus');
  const locale = useLocale();
  const [filter, setFilter] = React.useState<'all' | 'scheduled' | 'draft' | 'finalized'>('all');
  const [, force] = React.useReducer((x) => x + 1, 0);

  const user = getCurrentUser();
  const encounters = listEncounters();
  const recs = agentRecommendations();

  const stats = React.useMemo(() => {
    return {
      scheduled: encounters.filter((e) => e.status === 'scheduled').length,
      done: encounters.filter((e) => e.status === 'finalized').length,
      minutes: encounters.reduce((s, e) => s + (e.minutesSaved ?? 0), 0),
      pending: encounters.filter((e) => (e.status === 'draft' || e.status === 'review') && !e.hasGuide).length,
    };
  }, [encounters]);

  const filtered = encounters.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return e.status === 'scheduled';
    if (filter === 'draft') return e.status === 'draft' || e.status === 'review';
    return e.status === 'finalized';
  });

  const open = (screen: ScreenKey, id: string) => openTab(screen, { id }, { paneId });

  const primaryAction = (e: Encounter) => {
    if (e.status === 'scheduled' || e.status === 'recording') {
      return (
        <Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => open('encounter', e.id)}>
          {e.status === 'recording' ? t('resume') : t('start')}
        </Button>
      );
    }
    if (e.status === 'finalized') {
      return (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FileText className="h-3.5 w-3.5" />}
          onClick={() => open('tiss', e.id)}
        >
          {t('openGuide')}
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        leftIcon={<ChevronRight className="h-3.5 w-3.5" />}
        onClick={() => open('review', e.id)}
      >
        {t('openNote')}
      </Button>
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={CalendarDays}
        title={t('title')}
        subtitle={
          <span className="capitalize">
            {formatLongDate(new Date(), locale)} · {t('subtitle', { count: encounters.length })}
          </span>
        }
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => open('encounter', 'new')}>
            {t('newEncounter')}
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('stats.scheduled')} value={stats.scheduled} icon={CalendarDays} tone="brand" />
        <StatCard label={t('stats.done')} value={stats.done} icon={CheckCircle2} tone="success" />
        <StatCard label={t('stats.minutes')} value={stats.minutes} icon={Timer} tone="accent" />
        <StatCard label={t('stats.pendingGuides')} value={stats.pending} icon={FileText} tone="warning" />
      </div>

      {/* agent nudge */}
      {recs.length > 0 && (
        <button
          onClick={() => openTab('agent', undefined, { paneId })}
          className="group mt-5 flex w-full items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-600/[0.06] px-4 py-3 text-left transition-colors hover:bg-brand-600/[0.1]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600/15 text-brand-600">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <p className="flex-1 text-sm text-ink/90">{t('agentNudge', { count: recs.length })}</p>
          <ChevronRight className="h-4 w-4 text-brand-600 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* filters */}
      <div className="mt-6 flex items-center justify-between">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('filters.all') },
            { value: 'scheduled', label: t('filters.scheduled') },
            { value: 'draft', label: t('filters.draft') },
            { value: 'finalized', label: t('filters.finalized') },
          ]}
        />
      </div>

      {/* list */}
      <div className="mt-3 overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
        {filtered.map((e, i) => {
          const p = getPatient(e.patientId);
          if (!p) return null;
          return (
            <div
              key={e.id}
              className={cn(
                'flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-center',
                i !== filtered.length - 1 && 'border-b border-hairline/60',
              )}
            >
              <div className="flex w-20 shrink-0 items-center gap-1.5 font-mono text-sm text-muted">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(e.scheduledAt, locale)}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={p.name} hue={p.hue} size={38} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted">{p.payer}</p>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Badge tone={TYPE_TONE[e.type] ?? 'neutral'}>{typeLabel(e.type, locale)}</Badge>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone={STATUS_TONE[e.status]} dot>
                  {ts(e.status)}
                </Badge>
                <div className="ml-auto sm:ml-0">{primaryAction(e)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ScreenContainer>
  );
}

export const ENCOUNTER_TYPE_LABELS: Record<string, Record<string, string>> = {
  firstVisit: { 'pt-BR': '1ª consulta', en: 'First visit', 'zh-CN': '初诊', 'fr-FR': '1re visite' },
  followUp: { 'pt-BR': 'Retorno', en: 'Follow-up', 'zh-CN': '复诊', 'fr-FR': 'Suivi' },
  urgent: { 'pt-BR': 'Urgência', en: 'Urgent', 'zh-CN': '急诊', 'fr-FR': 'Urgence' },
  telemedicine: { 'pt-BR': 'Telemedicina', en: 'Telehealth', 'zh-CN': '远程', 'fr-FR': 'Téléconsult.' },
};

function typeLabel(type: string, locale: string) {
  return ENCOUNTER_TYPE_LABELS[type]?.[locale] ?? ENCOUNTER_TYPE_LABELS[type]?.['pt-BR'] ?? type;
}
