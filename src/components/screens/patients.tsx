'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Users,
  Search,
  Plus,
  X,
  CalendarClock,
  CreditCard,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { listPatients, listEncounters, getPatient, addPatient } from '@/lib/data/store';
import type { ConsentStatus, EncounterStatus, Patient } from '@/lib/types';
import { ScreenContainer, ScreenHeader, Table, Th, Td } from './_kit';
import { Avatar, IconButton, Separator } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal, Sheet } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatDate, formatTime, cn } from '@/lib/utils';

const CONSENT_TONE: Record<ConsentStatus, React.ComponentProps<typeof Badge>['tone']> = {
  granted: 'success',
  pending: 'warning',
  revoked: 'danger',
};

const STATUS_TONE: Record<EncounterStatus, React.ComponentProps<typeof Badge>['tone']> = {
  scheduled: 'neutral',
  recording: 'accent',
  draft: 'warning',
  review: 'info',
  finalized: 'success',
};

function ageFromBirth(birthDate: string) {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / 3.15576e10);
}

export function PatientsScreen({ paneId }: { paneId: string }) {
  void paneId;
  const t = useTranslations('patients');
  const ts = useTranslations('encounterStatus');
  const tc = useTranslations('common');
  const tf = useTranslations('feedback');
  const locale = useLocale();

  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newPayer, setNewPayer] = React.useState('');
  const [, force] = React.useReducer((x) => x + 1, 0);

  const patients = listPatients();
  const encounters = listEncounters();

  const doAdd = () => {
    if (!newName.trim()) return;
    addPatient({ name: newName, payer: newPayer });
    setAddOpen(false);
    setNewName('');
    setNewPayer('');
    force();
    toast.success(tf('added'));
  };

  const countByPatient = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of encounters) map[e.patientId] = (map[e.patientId] ?? 0) + 1;
    return map;
  }, [encounters]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, query]);

  const selected = selectedId ? getPatient(selectedId) : undefined;
  const selectedEncounters = React.useMemo(() => {
    if (!selected) return [];
    return encounters
      .filter((e) => e.patientId === selected.id)
      .slice()
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
  }, [encounters, selected]);

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Users}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search')}
                aria-label={tc('actions.search')}
                className="pl-9"
              />
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>{t('add')}</Button>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={tc('states.empty')}
          description={t('subtitle')}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t('columns.name')}</Th>
              <Th className="hidden sm:table-cell">{t('columns.age')}</Th>
              <Th className="hidden md:table-cell">{t('columns.payer')}</Th>
              <Th className="hidden lg:table-cell">{t('columns.lastVisit')}</Th>
              <Th>{t('columns.consent')}</Th>
              <Th className="hidden sm:table-cell text-right">{t('columns.encounters')}</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                tabIndex={0}
                role="button"
                onClick={() => setSelectedId(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(p.id);
                  }
                }}
                className="group cursor-pointer outline-none transition-colors hover:bg-ink/[0.02] focus-visible:bg-ink/[0.03]"
              >
                <Td>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={p.name} hue={p.hue} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted sm:hidden">
                        {t('yearsOld', { age: ageFromBirth(p.birthDate) })} · {p.payer}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden whitespace-nowrap text-muted tnum sm:table-cell">
                  {t('yearsOld', { age: ageFromBirth(p.birthDate) })}
                </Td>
                <Td className="hidden whitespace-nowrap text-muted md:table-cell">{p.payer}</Td>
                <Td className="hidden whitespace-nowrap text-muted lg:table-cell">
                  {p.lastVisit ? formatDate(p.lastVisit, locale) : '—'}
                </Td>
                <Td>
                  <Badge tone={CONSENT_TONE[p.consent]} dot>
                    {t(`consent.${p.consent}`)}
                  </Badge>
                </Td>
                <Td className="hidden text-right font-medium tnum sm:table-cell">
                  {countByPatient[p.id] ?? 0}
                </Td>
                <Td>
                  <ChevronRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-muted" />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <PatientSheet
        patient={selected}
        encounters={selectedEncounters}
        open={!!selected}
        onClose={() => setSelectedId(null)}
        labels={{
          history: t('detail.history'),
          noEncounters: t('detail.noEncounters'),
          consent: t('columns.consent'),
        }}
        consentLabel={(c) => t(`consent.${c}`)}
        statusLabel={(s) => ts(s)}
        locale={locale}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('add')} size="sm">
        <div className="flex flex-col gap-4 p-5">
          <Field label={t('columns.name')}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          </Field>
          <Field label={t('columns.payer')}>
            <Input value={newPayer} onChange={(e) => setNewPayer(e.target.value)} placeholder="Unimed" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={doAdd} disabled={!newName.trim()}>
              {tc('actions.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}

function PatientSheet({
  patient,
  encounters,
  open,
  onClose,
  labels,
  consentLabel,
  statusLabel,
  locale,
}: {
  patient: Patient | undefined;
  encounters: ReturnType<typeof listEncounters>;
  open: boolean;
  onClose: () => void;
  labels: { history: string; noEncounters: string; consent: string };
  consentLabel: (c: ConsentStatus) => string;
  statusLabel: (s: EncounterStatus) => string;
  locale: string;
}) {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  return (
    <Sheet open={open} onClose={onClose}>
      {patient && (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-hairline p-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <Avatar name={patient.name} hue={patient.hue} size={52} />
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-semibold tracking-tight">
                  {patient.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {t('yearsOld', { age: ageFromBirth(patient.birthDate) })} · {patient.payer}
                </p>
              </div>
            </div>
            <IconButton onClick={onClose} aria-label={tc('actions.close')} className="-mr-1 -mt-1 shrink-0">
              <X className="h-4 w-4" />
            </IconButton>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {/* meta card */}
            <div className="grid grid-cols-2 gap-3">
              <MetaItem
                icon={CreditCard}
                label={t('columns.payer')}
                value={patient.payer}
                tone="brand"
              />
              <MetaItem
                icon={CalendarClock}
                label={t('columns.lastVisit')}
                value={patient.lastVisit ? formatDate(patient.lastVisit, locale) : '—'}
                tone="accent"
              />
            </div>

            {/* consent */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-hairline bg-card p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-lg',
                    patient.consent === 'granted'
                      ? 'bg-success/12 text-success-fg dark:text-success'
                      : patient.consent === 'pending'
                        ? 'bg-warning/12 text-warning-fg dark:text-warning'
                        : 'bg-danger/12 text-danger-fg dark:text-danger',
                  )}
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
                <p className="text-sm font-medium text-ink/90">{labels.consent}</p>
              </div>
              <Badge tone={CONSENT_TONE[patient.consent]} dot>
                {consentLabel(patient.consent)}
              </Badge>
            </div>

            <Separator className="my-5" />

            {/* history */}
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-subtle">
              {labels.history}
            </h3>
            {encounters.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-6 w-6" />}
                title={labels.noEncounters}
                className="py-10"
              />
            ) : (
              <ol className="overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
                {encounters.map((e, i) => (
                  <li
                    key={e.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      i !== encounters.length - 1 && 'border-b border-hairline/60',
                    )}
                  >
                    <span className="flex w-16 shrink-0 items-center gap-1.5 font-mono text-xs text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(e.scheduledAt, locale)}
                    </span>
                    <span className="flex-1 truncate text-sm text-muted">
                      {formatDate(e.scheduledAt, locale)}
                    </span>
                    <Badge tone={STATUS_TONE[e.status]} dot>
                      {statusLabel(e.status)}
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  value: React.ReactNode;
  tone: 'brand' | 'accent';
}) {
  const toneCls =
    tone === 'brand' ? 'text-brand-600 bg-brand-600/10' : 'text-accent-500 bg-accent-400/12';
  return (
    <div className="rounded-xl border border-hairline bg-card p-4 shadow-xs">
      <span className={cn('grid h-7 w-7 place-items-center rounded-lg', toneCls)}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2.5 text-2xs font-medium uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
