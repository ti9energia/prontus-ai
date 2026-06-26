'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  Check,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  FileText,
  History,
  ListChecks,
  MessageSquare,
  Pencil,
  PenLine,
  Pill,
  Plus,
  Save,
  Sparkles,
  Stethoscope,
  TrendingUp,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  createGuideFromEncounter,
  ensureNote,
  getCurrentUser,
  getEncounter,
  getNote,
  getPatient,
  listEncounters,
  approveNote as approveNoteStore,
} from '@/lib/data/store';
import type { ClinicalNote, Encounter, NoteSection, NoteSectionKey, Patient } from '@/lib/types';
import { openTab } from '@/lib/workspace/store';
import { ScreenContainer } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { cn, formatPercent, clock, formatDate } from '@/lib/utils';

function resolveEncounterId(id?: string) {
  if (id && getEncounter(id)) return id;
  const withNote = listEncounters().find((e) => e.status === 'review' || e.hasNote);
  return withNote?.id ?? listEncounters()[0]?.id;
}

/* ----------------------------------------------------------------------------
 * Deterministic seeds for the locally-edited sections (HPP, medications,
 * progress note). No Math.random — content is stable per encounter so the
 * record looks the same on every render, yet differs between patients.
 * -------------------------------------------------------------------------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

const HPP_SEEDS: readonly string[] = [
  'Hipertensão arterial sistêmica em acompanhamento há mais de 5 anos. Nega diabetes mellitus, dislipidemia ou cirurgias prévias. Sem alergias medicamentosas conhecidas.',
  'Nega comorbidades crônicas relevantes. Apendicectomia na infância, sem intercorrências. Imunizações em dia. Sem histórico de internações recentes.',
  'Diabetes mellitus tipo 2 e dislipidemia em tratamento regular. Ex-tabagista (carga tabágica de 10 maços-ano). Nega alergias medicamentosas.',
];

const EVOL_SEEDS: readonly string[] = [
  '{name} retorna para reavaliação. Refere melhora parcial dos sintomas após início do tratamento, com boa adesão medicamentosa. Mantida conduta com reforço das orientações.',
  '{name} evolui clinicamente estável, sem queixas novas. Exames de controle dentro da normalidade. Mantido o plano terapêutico vigente.',
  'Persistência dos sintomas relatada por {name} apesar do tratamento instituído. Reavaliada a conduta e solicitados exames complementares para investigação.',
];

const MED_SEEDS: readonly string[][] = [
  ['Losartana 50 mg — 1 comprimido 12/12h', 'Hidroclorotiazida 25 mg — 1 comprimido pela manhã'],
  ['Metformina 850 mg — 1 comprimido 2x/dia', 'Sinvastatina 20 mg — 1 comprimido à noite'],
  ['Omeprazol 20 mg — 1 comprimido em jejum'],
];

const KNOWN_MEDS: ReadonlyArray<readonly [string, string]> = [
  ['losartana', 'Losartana 50 mg — 1 comprimido 12/12h'],
  ['hidroclorotiazida', 'Hidroclorotiazida 25 mg — 1 comprimido pela manhã'],
  ['metformina', 'Metformina 850 mg — 1 comprimido 2x/dia'],
  ['sinvastatina', 'Sinvastatina 20 mg — 1 comprimido à noite'],
  ['omeprazol', 'Omeprazol 20 mg — 1 comprimido em jejum'],
  ['amoxicilina', 'Amoxicilina 500 mg — 1 comprimido 8/8h'],
  ['dipirona', 'Dipirona 500 mg — 1 comprimido se dor'],
];

function seedHpp(enc: Encounter): string {
  return pick(HPP_SEEDS, hashStr(`${enc.id}:hpp`));
}

function seedEvolucao(enc: Encounter, patient: Patient): string {
  const first = patient.name.split(' ')[0] || patient.name;
  return pick(EVOL_SEEDS, hashStr(`${enc.id}:evo`)).replace('{name}', first);
}

function seedMeds(enc: Encounter, note: ClinicalNote): string[] {
  const text = note.sections.map((s) => s.content).join(' ').toLowerCase();
  const found = KNOWN_MEDS.filter(([needle]) => text.includes(needle)).map(([, label]) => label);
  if (found.length) return found;
  return [...pick(MED_SEEDS, hashStr(`${enc.id}:med`))];
}

interface Med {
  id: string;
  text: string;
}

export function ReviewScreen({ paneId, params }: { paneId: string; params?: Record<string, string> }) {
  const t = useTranslations('review');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const encId = resolveEncounterId(params?.id);
  const enc = encId ? getEncounter(encId) : undefined;
  const patient = enc ? getPatient(enc.patientId) : undefined;
  const note = encId ? getNote(encId) ?? ensureNote(encId) : undefined;
  const user = getCurrentUser();

  // AI-structured, store-backed sections (queixa/hma/exame/hipoteses/conduta).
  const [sections, setSections] = React.useState<NoteSection[]>(() =>
    note ? note.sections.map((s) => ({ ...s })) : [],
  );
  const [approvedAll, setApprovedAll] = React.useState(note?.approved ?? false);

  // Locally-authored sections — seeded deterministically from the encounter.
  const [extras, setExtras] = React.useState<{ hpp: string; evolucao: string }>(() => ({
    hpp: enc ? seedHpp(enc) : '',
    evolucao: enc && patient ? seedEvolucao(enc, patient) : '',
  }));
  const [editingKey, setEditingKey] = React.useState<'hpp' | 'evolucao' | null>(null);
  const [draft, setDraft] = React.useState('');

  const [meds, setMeds] = React.useState<Med[]>(() =>
    enc && note ? seedMeds(enc, note).map((text, i) => ({ id: `med_${i}`, text })) : [],
  );
  const [newMed, setNewMed] = React.useState('');
  const medSeq = React.useRef(0);

  const [signerName, setSignerName] = React.useState(user.name);
  const [signedAt, setSignedAt] = React.useState<string | null>(null);

  if (!enc || !patient || !note) {
    return (
      <ScreenContainer>
        <p className="text-muted">—</p>
      </ScreenContainer>
    );
  }

  /* ----------------------------- store sections ----------------------------- */

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
    toast.success(t('approvedAll'));
  };

  const generateTiss = () => {
    persist();
    if (!note.approved) approveNoteStore(enc.id);
    createGuideFromEncounter(enc.id);
    openTab('tiss', { id: enc.id }, { paneId });
  };

  const allApproved = sections.every((s) => s.approved);

  /* ----------------------------- local sections ----------------------------- */

  const startEdit = (key: 'hpp' | 'evolucao', current: string) => {
    setEditingKey(key);
    setDraft(current);
  };
  const cancelEdit = () => {
    setEditingKey(null);
    setDraft('');
  };
  const saveExtra = (key: 'hpp' | 'evolucao') => {
    setExtras((e) => ({ ...e, [key]: draft.trim() }));
    setEditingKey(null);
    setDraft('');
    toast.success(L('Seção salva', 'Section saved', '小节已保存', 'Section enregistrée'));
  };

  const addMed = () => {
    const v = newMed.trim();
    if (!v) return;
    medSeq.current += 1;
    setMeds((m) => [...m, { id: `med_new_${medSeq.current}`, text: v }]);
    setNewMed('');
    toast.success(L('Medicamento adicionado', 'Medication added', '已添加用药', 'Médicament ajouté'));
  };
  const removeMed = (id: string) => {
    setMeds((m) => m.filter((x) => x.id !== id));
    toast.success(L('Medicamento removido', 'Medication removed', '已移除用药', 'Médicament retiré'));
  };

  const signRecord = () => {
    if (!signerName.trim()) return;
    setSignedAt(new Date().toISOString());
    toast.success(L('Prontuário assinado', 'Record signed', '病历已签署', 'Dossier signé'));
  };
  const signed = signedAt !== null;

  /* -------------------------------- renderers ------------------------------- */

  const renderStore = (key: NoteSectionKey, Icon: LucideIcon, title: string) => {
    const s = sections.find((x) => x.key === key);
    if (!s) return null;
    return (
      <div
        key={key}
        className={cn(
          'rounded-xl border bg-card p-4 shadow-xs transition-colors',
          s.approved ? 'border-success/30' : 'border-hairline',
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-600" />
            <h3 className="font-display text-sm font-semibold">{title}</h3>
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
    );
  };

  const renderText = (key: 'hpp' | 'evolucao', Icon: LucideIcon, title: string) => {
    const value = extras[key];
    const isEditing = editingKey === key;
    return (
      <div key={key} className="rounded-xl border border-hairline bg-card p-4 shadow-xs transition-colors">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-600" />
            <h3 className="font-display text-sm font-semibold">{title}</h3>
            <Badge tone="neutral">{L('Manual', 'Manual', '手动', 'Manuel')}</Badge>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                {L('Cancelar', 'Cancel', '取消', 'Annuler')}
              </button>
              <button
                onClick={() => saveExtra(key)}
                className="inline-flex items-center gap-1 rounded-md bg-brand-600/12 px-2 py-1 text-2xs font-medium text-brand-700 transition-colors hover:bg-brand-600/20 dark:text-brand-300"
              >
                <Save className="h-3.5 w-3.5" />
                {L('Salvar', 'Save', '保存', 'Enregistrer')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => startEdit(key, value)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
            >
              <Pencil className="h-3.5 w-3.5" />
              {L('Editar', 'Edit', '编辑', 'Modifier')}
            </button>
          )}
        </div>
        {isEditing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={L('Descreva…', 'Describe…', '请描述…', 'Décrivez…')}
            className="min-h-[84px] resize-y"
          />
        ) : value ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{value}</p>
        ) : (
          <p className="text-sm italic text-muted">
            {L('Sem informações registradas.', 'No information recorded.', '暂无记录。', 'Aucune information.')}
          </p>
        )}
      </div>
    );
  };

  const renderMeds = (Icon: LucideIcon, title: string) => (
    <div key="medicamentos" className="rounded-xl border border-hairline bg-card p-4 shadow-xs">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <Badge tone="neutral">{meds.length}</Badge>
      </div>
      {meds.length === 0 ? (
        <p className="mb-2 text-sm italic text-muted">
          {L('Nenhum medicamento em uso.', 'No current medications.', '无在用药物。', 'Aucun traitement en cours.')}
        </p>
      ) : (
        <ul className="mb-2 space-y-1.5">
          {meds.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface/40 px-2.5 py-1.5 text-sm"
            >
              <span className="flex items-center gap-2">
                <Pill className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                {m.text}
              </span>
              <button
                onClick={() => removeMed(m.id)}
                aria-label={L('Remover', 'Remove', '移除', 'Retirer')}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-danger/10 hover:text-danger-fg dark:hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={newMed}
          onChange={(e) => setNewMed(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addMed();
            }
          }}
          placeholder={L(
            'Medicamento, dose e posologia…',
            'Medication, dose and schedule…',
            '药物、剂量与用法…',
            'Médicament, dose et posologie…',
          )}
        />
        <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={addMed}>
          {L('Adicionar', 'Add', '添加', 'Ajouter')}
        </Button>
      </div>
    </div>
  );

  const renderSignature = () => (
    <div key="assinatura" className="rounded-xl border border-brand-500/25 bg-brand-600/[0.05] p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-brand-600" />
        <h3 className="font-display text-sm font-semibold">
          {L('Assinatura', 'Signature', '签名', 'Signature')}
        </h3>
        {signed && (
          <Badge tone="success" className="gap-1">
            <Check className="h-3 w-3" />
            {L('Assinado', 'Signed', '已签署', 'Signé')}
          </Badge>
        )}
      </div>
      {signedAt !== null ? (
        <div className="rounded-lg border border-success/30 bg-success/[0.06] p-3">
          <p className="text-sm font-medium">{signerName}</p>
          <p className="mt-0.5 text-xs text-muted">{user.council}</p>
          <p className="mt-1 text-2xs text-subtle">
            {L('Assinado em', 'Signed on', '签署于', 'Signé le')}{' '}
            {formatDate(signedAt, locale, { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field
            label={L('Profissional responsável', 'Responsible professional', '负责医师', 'Professionnel responsable')}
            hint={user.council}
            className="flex-1"
          >
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder={L('Nome do profissional', 'Professional name', '医师姓名', 'Nom du professionnel')}
            />
          </Field>
          <Button
            leftIcon={<PenLine className="h-4 w-4" />}
            onClick={signRecord}
            disabled={!signerName.trim()}
          >
            {L('Assinar prontuário', 'Sign record', '签署病历', 'Signer le dossier')}
          </Button>
        </div>
      )}
    </div>
  );

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

          {renderStore('queixa', MessageSquare, L('Anamnese', 'Anamnesis', '病史采集', 'Anamnèse'))}
          {renderStore(
            'hma',
            Activity,
            L(
              'HDA — história da doença atual',
              'HPI — history of present illness',
              '现病史',
              'HMA — histoire de la maladie actuelle',
            ),
          )}
          {renderText(
            'hpp',
            History,
            L(
              'HPP — história patológica pregressa',
              'PMH — past medical history',
              '既往史',
              'ATCD — antécédents pathologiques',
            ),
          )}
          {renderMeds(Pill, L('Medicamentos em uso', 'Current medications', '当前用药', 'Traitements en cours'))}
          {renderStore('exame', Stethoscope, L('Exame físico', 'Physical examination', '体格检查', 'Examen physique'))}
          {renderStore(
            'hipoteses',
            ListChecks,
            L(
              'Hipóteses diagnósticas (CID)',
              'Diagnostic hypotheses (ICD)',
              '诊断假设 (ICD)',
              'Hypothèses diagnostiques (CIM)',
            ),
          )}
          {renderStore('conduta', ClipboardList, L('Plano terapêutico', 'Treatment plan', '治疗方案', 'Plan thérapeutique'))}
          {renderText('evolucao', TrendingUp, L('Evolução', 'Progress note', '病程记录', 'Évolution'))}
          {renderSignature()}
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
