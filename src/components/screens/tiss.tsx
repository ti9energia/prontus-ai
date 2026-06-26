'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  Info,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  createGuideFromEncounter,
  getEncounter,
  getGuide,
  getGuideByEncounter,
  getPatient,
  listGuides,
  submitGuide as submitGuideStore,
} from '@/lib/data/store';
import type { GuideStatus, GuideType, IssueSeverity, TissGuide } from '@/lib/types';
import { ScreenContainer, ScreenHeader, SectionTitle, Table, Th, Td } from './_kit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { Avatar } from '@/components/ui/misc';
import { toast } from '@/lib/toast';
import { cn, formatCurrency } from '@/lib/utils';

function resolveGuide(id?: string): TissGuide | undefined {
  if (id) {
    const g = getGuide(id);
    if (g) return g;
    const byEnc = getGuideByEncounter(id);
    if (byEnc) return byEnc;
    if (getEncounter(id)) return createGuideFromEncounter(id);
  }
  return listGuides()[0];
}

const STATUS_TONE: Record<GuideStatus, React.ComponentProps<typeof Badge>['tone']> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  glossed: 'danger',
};

const SEVERITY: Record<IssueSeverity, { tone: React.ComponentProps<typeof Badge>['tone']; icon: typeof Info }> = {
  high: { tone: 'danger', icon: AlertTriangle },
  medium: { tone: 'warning', icon: AlertTriangle },
  low: { tone: 'info', icon: Info },
};

export function TissScreen({ params }: { paneId: string; params?: Record<string, string> }) {
  const t = useTranslations('tiss');
  const tg = useTranslations('billing.guideStatus');
  const tb = useTranslations('billing.columns');
  const tc = useTranslations('common.actions');
  const tf = useTranslations('feedback');
  const locale = useLocale();
  const [, force] = React.useReducer((x) => x + 1, 0);

  const guide = resolveGuide(params?.id);
  const patient = guide ? getPatient(guide.patientId) : undefined;

  const [type, setType] = React.useState<GuideType>(guide?.type ?? 'consulta');
  const [status, setStatus] = React.useState<GuideStatus>(guide?.status ?? 'draft');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [exported, setExported] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [check, setCheck] = React.useState<
    { score: number; ready: boolean; issues: TissGuide['issues']; payer?: string } | null
  >(null);

  if (!guide) {
    return (
      <ScreenContainer>
        <p className="text-muted">—</p>
      </ScreenContainer>
    );
  }

  const issues = guide.issues ?? [];
  const total = guide.procedures.reduce((s, p) => s + p.value * p.qty, 0);
  const shownIssues = check?.issues ?? issues;
  const isReady = check ? check.ready : issues.length === 0;

  const doSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      // Parity with the tiss.submit tool: run the pre-denial check and never submit
      // while high-severity issues remain (fail-closed if the check can't confirm).
      const res = await fetch('/api/ai/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: 'glosa.check', input: { guideId: guide.id }, locale }),
      });
      const body = await res.json().catch(() => null);
      const result = body?.data;
      if (result?.ok && result.data) {
        setCheck({
          score: result.data.score,
          ready: result.data.ready,
          issues: result.data.issues ?? [],
          payer: result.data.payer,
        });
        if (result.data.ready) {
          submitGuideStore(guide.id);
          setStatus('sent');
          toast.success(t('submitted'));
        } else {
          toast.error(result.summary);
        }
      } else {
        toast.error(result?.summary ?? t('validation'));
      }
    } catch {
      toast.error(t('validation'));
    } finally {
      setSubmitting(false);
    }
  };

  const doExport = () => {
    setExported(true);
    toast.success(t('exported'));
  };

  const removeProcedure = (idx: number) => {
    guide.procedures.splice(idx, 1);
    guide.value = guide.procedures.reduce((s, p) => s + p.value * p.qty, 0);
    force();
    toast.success(tf('removed'));
  };
  const comingSoon = () => toast.success(tf('comingSoon'));

  // Ask Mari to run the pre-denial (pré-glosa) check on this guide.
  const runPreGlosa = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/ai/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: 'glosa.check', input: { guideId: guide.id }, locale }),
      });
      const body = await res.json().catch(() => null);
      const result = body?.data;
      if (result?.ok && result.data) {
        setCheck({
          score: result.data.score,
          ready: result.data.ready,
          issues: result.data.issues ?? [],
          payer: result.data.payer,
        });
        (result.data.ready ? toast.success : toast.error)(result.summary);
      } else {
        toast.error(result?.summary ?? t('validation'));
      }
    } catch {
      toast.error(t('validation'));
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={FileCheck}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[status]} dot>
              {tg(status)}
            </Badge>
            <Button
              variant="outline"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              onClick={runPreGlosa}
              loading={checking}
            >
              {t('preGloss')}
            </Button>
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={doExport}
            >
              {exported ? t('exported') : t('export')}
            </Button>
            <Button
              leftIcon={<Send className="h-4 w-4" />}
              loading={submitting}
              disabled={status === 'sent' || status === 'paid'}
              onClick={() => setConfirmOpen(true)}
            >
              {status === 'sent' || status === 'paid' ? t('submitted') : t('submit')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* main form */}
        <div className="space-y-5">
          {/* meta */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-hairline bg-card p-4 shadow-xs sm:grid-cols-2">
            <Field label={t('guideType')}>
              <Select value={type} onChange={(e) => setType(e.target.value as GuideType)}>
                <option value="consulta">{t('types.consulta')}</option>
                <option value="sadt">{t('types.sadt')}</option>
                <option value="internacao">{t('types.internacao')}</option>
              </Select>
            </Field>
            <Field label={t('payer')}>
              <Input defaultValue={guide.payer} />
            </Field>
          </div>

          {/* beneficiary */}
          <div className="rounded-xl border border-hairline bg-card p-4 shadow-xs">
            <SectionTitle>{t('beneficiary')}</SectionTitle>
            <div className="flex items-center gap-3 rounded-lg bg-surface/50 p-3">
              {patient && <Avatar name={patient.name} hue={patient.hue} size={40} />}
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t('cardNumber')}>
                  <Input defaultValue={guide.cardNumber} className="font-mono" />
                </Field>
                <Field label={t('professional')}>
                  <Input defaultValue={guide.professional} />
                </Field>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label={t('council')}>
                <Input defaultValue={guide.council} />
              </Field>
              <Field label={t('cbo')}>
                <Input defaultValue={guide.cbo} className="font-mono" />
              </Field>
            </div>
          </div>

          {/* procedures */}
          <div>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={comingSoon}>
                  {t('addProcedure')}
                </Button>
              }
            >
              {t('procedures')}
            </SectionTitle>
            <Table>
              <thead>
                <tr>
                  <Th>{t('procedureCode')}</Th>
                  <Th>{t('procedureDesc')}</Th>
                  <Th className="text-center">{t('qty')}</Th>
                  <Th className="text-right">{tb('value')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {guide.procedures.map((p, i) => (
                  <tr key={i} className="hover:bg-ink/[0.02]">
                    <Td className="font-mono font-semibold text-brand-700 dark:text-brand-300">{p.code}</Td>
                    <Td>{p.description}</Td>
                    <Td className="text-center tnum">{p.qty}</Td>
                    <Td className="text-right tnum font-medium">{formatCurrency(p.value, locale, guide.currency)}</Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => removeProcedure(i)}
                        aria-label={tc('delete')}
                        className="text-subtle transition-colors hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
                <tr>
                  <Td className="font-semibold" />
                  <Td />
                  <Td />
                  <Td className="text-right font-display font-bold tnum">{formatCurrency(total, locale, guide.currency)}</Td>
                  <Td />
                </tr>
              </tbody>
            </Table>
          </div>

          {/* diagnoses */}
          <div>
            <SectionTitle
              action={
                <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={comingSoon}>
                  {t('addDiagnosis')}
                </Button>
              }
            >
              {t('diagnoses')}
            </SectionTitle>
            <div className="flex flex-wrap gap-2">
              {guide.diagnoses.length === 0 && (
                <span className="text-sm text-muted">{t('fields.missingCid')}</span>
              )}
              {guide.diagnoses.map((d) => (
                <span
                  key={d.code}
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-card px-2.5 py-1.5 text-sm"
                >
                  <span className="font-mono font-semibold text-brand-700 dark:text-brand-300">{d.code}</span>
                  <span className="text-muted">{d.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* validation sidebar */}
        <aside className="space-y-4">
          <div
            className={cn(
              'rounded-xl border p-4 shadow-xs',
              isReady ? 'border-success/30 bg-success/[0.06]' : 'border-warning/30 bg-warning/[0.06]',
            )}
          >
            <div className="flex items-center gap-2">
              {isReady ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <h3 className="font-display text-sm font-semibold">{t('validation')}</h3>
              {check?.payer && <span className="text-2xs font-medium text-muted">· {check.payer}</span>}
              {check && (
                <Badge tone={isReady ? 'success' : 'warning'} className="ml-auto">
                  {t('readiness')} {check.score}/100
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {shownIssues.length === 0 ? t('validationOk') : t('validationDesc', { count: shownIssues.length })}
            </p>

            <div className="mt-3 space-y-2">
              {shownIssues.map((iss) => {
                const sev = SEVERITY[iss.severity];
                const Icon = sev.icon;
                return (
                  <div key={iss.id} className="flex items-start gap-2 rounded-lg border border-hairline bg-card p-2.5">
                    <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iss.severity === 'high' ? 'text-danger' : 'text-warning')} />
                    <div>
                      <p className="text-sm">{t(`fields.${iss.messageKey}` as 'fields.required')}</p>
                      <Badge tone={sev.tone} className="mt-1">
                        {t(`severity.${iss.severity}` as 'severity.high')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-card p-4 shadow-xs">
            <p className="text-2xs font-semibold uppercase tracking-wide text-subtle">{t('payer')}</p>
            <p className="mt-1 font-medium">{guide.payer}</p>
            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
              <span className="text-sm text-muted">{t('procedures')}</span>
              <span className="font-display text-lg font-bold tnum">{formatCurrency(total, locale, guide.currency)}</span>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('confirmSubmitTitle')}
        description={t('confirmSubmitBody')}
      >
        <div className="flex justify-end gap-2 p-5">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            {tc('cancel')}
          </Button>
          <Button leftIcon={<Send className="h-4 w-4" />} onClick={doSubmit}>
            {t('submit')}
          </Button>
        </div>
      </Modal>
    </ScreenContainer>
  );
}
