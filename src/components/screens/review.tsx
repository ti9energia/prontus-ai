'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Check,
  ClipboardCheck,
  FileText,
  RotateCw,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';
import {
  createGuideFromEncounter,
  ensureNote,
  getEncounter,
  getNote,
  getPatient,
  listEncounters,
  approveNote as approveNoteStore,
} from '@/lib/data/store';
import type { NoteSection, NoteSectionKey } from '@/lib/types';
import { openTab } from '@/lib/workspace/store';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { cn, formatPercent, clock } from '@/lib/utils';

function resolveEncounterId(id?: string) {
  if (id && getEncounter(id)) return id;
  const withNote = listEncounters().find((e) => e.status === 'review' || e.hasNote);
  return withNote?.id ?? listEncounters()[0]?.id;
}

export function ReviewScreen({ paneId, params }: { paneId: string; params?: Record<string, string> }) {
  const t = useTranslations('review');
  const ts = useTranslations('encounter.sections');
  const locale = useLocale();

  const encId = resolveEncounterId(params?.id);
  const enc = encId ? getEncounter(encId) : undefined;
  const patient = enc ? getPatient(enc.patientId) : undefined;
  const note = encId ? getNote(encId) ?? ensureNote(encId) : undefined;

  const [sections, setSections] = React.useState<NoteSection[]>(() =>
    note ? note.sections.map((s) => ({ ...s })) : [],
  );
  const [approvedAll, setApprovedAll] = React.useState(note?.approved ?? false);

  if (!enc || !patient || !note) {
    return (
      <ScreenContainer>
        <p className="text-muted">—</p>
      </ScreenContainer>
    );
  }

  const updateSection = (key: NoteSectionKey, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, content, inferred: false } : s)),
    );
  };
  const toggleApprove = (key: NoteSectionKey) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, approved: !s.approved } : s)));
  };

  const persist = () => {
    note.sections = sections.map((s) => ({ ...s }));
    note.updatedAt = new Date().toISOString();
  };

  const approveAll = () => {
    setSections((prev) => prev.map((s) => ({ ...s, approved: true })));
    setApprovedAll(true);
    persist();
    approveNoteStore(enc.id);
  };

  const generateTiss = () => {
    persist();
    if (!note.approved) approveNoteStore(enc.id);
    createGuideFromEncounter(enc.id);
    openTab('tiss', { id: enc.id }, { paneId });
  };

  const allApproved = sections.every((s) => s.approved);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-card/60 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar name={patient.name} hue={patient.hue} size={36} />
          <div>
            <p className="text-sm font-semibold leading-tight">{patient.name}</p>
            <p className="text-2xs text-muted">
              {patient.payer} · {enc.durationSec ? clock(enc.durationSec) : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ClipboardCheck className="h-3.5 w-3.5" />}
            onClick={approveAll}
            disabled={approvedAll}
          >
            {approvedAll ? t('approvedAll') : t('approveAll')}
          </Button>
          <Button size="sm" leftIcon={<FileText className="h-3.5 w-3.5" />} onClick={generateTiss}>
            {t('generateTiss')}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_320px]">
        {/* editor */}
        <div className="min-w-0 space-y-4 px-5 py-6 sm:px-8">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
          </div>

          {sections.map((s) => (
            <div
              key={s.key}
              className={cn(
                'rounded-xl border bg-card p-4 shadow-xs transition-colors',
                s.approved ? 'border-success/30' : 'border-hairline',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-brand-600" />
                  <h3 className="font-display text-sm font-semibold">
                    {ts(s.key as 'queixa')}
                  </h3>
                  {s.inferred ? (
                    <Badge tone="brand" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t('inferred')} · {formatPercent(s.confidence, locale, 0)}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">{t('edited')}</Badge>
                  )}
                </div>
                <button
                  onClick={() => toggleApprove(s.key)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors',
                    s.approved
                      ? 'bg-success/12 text-success-fg dark:text-success'
                      : 'text-muted hover:bg-ink/[0.06] hover:text-ink',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  {s.approved ? t('approved') : t('approveSection')}
                </button>
              </div>
              <Textarea
                value={s.content}
                onChange={(e) => updateSection(s.key, e.target.value)}
                placeholder={t('placeholder')}
                className="min-h-[84px] resize-y border-transparent bg-transparent px-0 focus:ring-0"
              />
            </div>
          ))}
        </div>

        {/* sidebar */}
        <aside className="space-y-5 border-t border-hairline bg-surface/40 px-5 py-6 lg:border-l lg:border-t-0">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-subtle">
              <User className="h-3.5 w-3.5" /> {t('patientInfo')}
            </p>
            <div className="rounded-xl border border-hairline bg-card p-3 text-sm">
              <p className="font-medium">{patient.name}</p>
              <p className="mt-0.5 text-xs text-muted">{patient.payer}</p>
              <p className="mt-0.5 font-mono text-2xs text-subtle">{patient.cardNumber}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-subtle">{t('diagnostics')}</p>
            <div className="flex flex-wrap gap-1.5">
              {note.cids.map((c) => (
                <span
                  key={c.code}
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-card px-2 py-1 text-xs"
                >
                  <span className="font-mono font-semibold text-brand-700 dark:text-brand-300">{c.code}</span>
                  <span className="text-muted">{c.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-subtle">{t('procedures')}</p>
            <div className="flex flex-col gap-1.5">
              {note.procedures.map((p) => (
                <div
                  key={p.code}
                  className="flex items-center justify-between rounded-md border border-hairline bg-card px-2.5 py-1.5 text-xs"
                >
                  <span className="text-muted">{p.label}</span>
                  <span className="font-mono font-semibold">{p.code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand-500/25 bg-brand-600/[0.06] p-4">
            <p className="text-sm font-medium">{allApproved ? t('approvedAll') : t('approveAll')}</p>
            <Button className="mt-3 w-full" leftIcon={<FileText className="h-4 w-4" />} onClick={generateTiss}>
              {t('generateTiss')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
