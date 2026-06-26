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
  Pencil,
  Fingerprint,
  Cake,
  Phone,
  Smartphone,
  User,
  AlertTriangle,
  FlaskConical,
  FileText,
  Stethoscope,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { listPatients, listEncounters, getPatient, addPatient } from '@/lib/data/store';
import type { ConsentStatus, EncounterStatus, Patient } from '@/lib/types';
import { ScreenContainer, ScreenHeader, Table, Th, Td } from './_kit';
import { Avatar, IconButton } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal, Sheet } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatDate, formatTime, timeAgo, cn } from '@/lib/utils';

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
  locale,
}: {
  patient: Patient | undefined;
  encounters: ReturnType<typeof listEncounters>;
  open: boolean;
  onClose: () => void;
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
            {/* keyed so all seeded + editable state resets cleanly per patient */}
            <PatientDetail key={patient.id} patient={patient} encounters={encounters} locale={locale} />
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ============================ patient record ============================ */

type Loc = readonly [string, string, string, string];
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];

const ALLERGY_POOL: Loc[] = [
  ['Penicilina', 'Penicillin', '青霉素', 'Pénicilline'],
  ['Dipirona', 'Dipyrone', '安乃近', 'Métamizole'],
  ['Frutos do mar', 'Shellfish', '海鲜', 'Fruits de mer'],
  ['Látex', 'Latex', '乳胶', 'Latex'],
  ['Ibuprofeno', 'Ibuprofen', '布洛芬', 'Ibuprofène'],
  ['Sulfas', 'Sulfa drugs', '磺胺类', 'Sulfamides'],
  ['Amendoim', 'Peanuts', '花生', 'Arachides'],
  ['Pólen', 'Pollen', '花粉', 'Pollen'],
];

const EXAM_POOL: Loc[] = [
  ['Hemograma completo', 'Complete blood count', '全血细胞计数', 'Hémogramme complet'],
  ['Eletrocardiograma (ECG)', 'Electrocardiogram (ECG)', '心电图 (ECG)', 'Électrocardiogramme (ECG)'],
  ['Raio-X de tórax', 'Chest X-ray', '胸部 X 光', 'Radiographie thoracique'],
  ['Ultrassonografia abdominal', 'Abdominal ultrasound', '腹部超声', 'Échographie abdominale'],
  ['Perfil lipídico', 'Lipid panel', '血脂检查', 'Bilan lipidique'],
  ['Glicemia de jejum', 'Fasting glucose', '空腹血糖', 'Glycémie à jeun'],
  ['Função renal', 'Renal function', '肾功能', 'Fonction rénale'],
  ['Ressonância magnética', 'MRI scan', '磁共振成像', 'IRM'],
];

const VISIT_POOL: Loc[] = [
  ['Consulta de retorno', 'Follow-up visit', '复诊', 'Consultation de suivi'],
  ['Primeira consulta', 'First visit', '首次就诊', 'Première consultation'],
  ['Teleconsulta', 'Telemedicine visit', '远程问诊', 'Téléconsultation'],
  ['Consulta de urgência', 'Urgent visit', '急诊就诊', 'Consultation urgente'],
];

const DOC_POOL: Loc[] = [
  ['Receita emitida', 'Prescription issued', '已开处方', 'Ordonnance émise'],
  ['Atestado médico', 'Medical certificate', '医疗证明', 'Certificat médical'],
  ['Pedido de exame', 'Exam request', '检查申请', 'Demande d’examen'],
  ['Encaminhamento gerado', 'Referral created', '已生成转诊', 'Orientation créée'],
  ['Relatório clínico', 'Clinical report', '临床报告', 'Compte rendu clinique'],
];

const EXAM_STATUS_KEYS = ['concluido', 'resultado', 'pendente'] as const;
type ExamStatus = (typeof EXAM_STATUS_KEYS)[number];
const EXAM_STATUS_META: Record<ExamStatus, { tone: BadgeTone; label: Loc }> = {
  concluido: { tone: 'success', label: ['Concluído', 'Completed', '已完成', 'Terminé'] },
  resultado: { tone: 'info', label: ['Resultado disponível', 'Result ready', '结果就绪', 'Résultat prêt'] },
  pendente: { tone: 'warning', label: ['Pendente', 'Pending', '处理中', 'En attente'] },
};

type TlKind = 'consulta' | 'documento' | 'exame';
const TL_META: Record<TlKind, { icon: LucideIcon; tone: BadgeTone; label: Loc }> = {
  consulta: { icon: Stethoscope, tone: 'brand', label: ['Consulta', 'Consultation', '就诊', 'Consultation'] },
  documento: { icon: FileText, tone: 'accent', label: ['Documento', 'Document', '文档', 'Document'] },
  exame: { icon: FlaskConical, tone: 'warning', label: ['Exame', 'Exam', '检查', 'Examen'] },
};

const TONE_CIRCLE: Record<NonNullable<BadgeTone>, string> = {
  brand: 'bg-brand-600/12 text-brand-600',
  accent: 'bg-accent-400/15 text-accent-600 dark:text-accent-300',
  neutral: 'bg-ink/[0.06] text-muted',
  success: 'bg-success/12 text-success-fg dark:text-success',
  warning: 'bg-warning/12 text-warning-fg dark:text-warning',
  danger: 'bg-danger/12 text-danger-fg dark:text-danger',
  info: 'bg-info/12 text-info-fg dark:text-info',
  outline: 'bg-ink/[0.04] text-muted',
};

interface SeedExam {
  id: string;
  name: Loc;
  status: ExamStatus;
  daysAgo: number;
}
interface TlEvent {
  id: string;
  kind: TlKind;
  title: Loc;
  daysAgo: number;
}

/* Deterministic, pure seeding — derived from the patient, never Math.random. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickN<T>(pool: readonly T[], n: number, rnd: () => number): T[] {
  const copy = pool.slice();
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  }
  return out;
}
function seedDigits(rnd: () => number, n: number): string {
  let d = '';
  for (let i = 0; i < n; i += 1) d += Math.floor(rnd() * 10).toString();
  return d;
}
function seedCpf(rnd: () => number): string {
  const d = seedDigits(rnd, 11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

interface PatientRecord {
  cpf: string;
  phone: string;
  mobile: string;
  allergies: Loc[];
  exams: SeedExam[];
  timeline: TlEvent[];
}
function buildRecord(seed: number, fallbackPhone?: string): PatientRecord {
  const rnd = makeRng(seed);
  const cpf = seedCpf(rnd);
  const landline = `(11) ${seedDigits(rnd, 4)}-${seedDigits(rnd, 4)}`;
  const mobile = `(11) 9${seedDigits(rnd, 4)}-${seedDigits(rnd, 4)}`;
  const allergies = pickN(ALLERGY_POOL, Math.floor(rnd() * 3), rnd); // 0..2
  const exams: SeedExam[] = pickN(EXAM_POOL, 2 + Math.floor(rnd() * 3), rnd).map((name, i) => ({
    id: `ex_${i}`,
    name,
    status: EXAM_STATUS_KEYS[Math.floor(rnd() * EXAM_STATUS_KEYS.length)],
    daysAgo: 3 + Math.floor(rnd() * 50),
  }));
  const kinds: TlKind[] = ['consulta', 'documento', 'exame'];
  const timeline: TlEvent[] = [];
  let d = Math.floor(rnd() * 3);
  const count = 5 + Math.floor(rnd() * 3); // 5..7, newest-first
  for (let i = 0; i < count; i += 1) {
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const pool = kind === 'consulta' ? VISIT_POOL : kind === 'documento' ? DOC_POOL : EXAM_POOL;
    timeline.push({ id: `tl_${i}`, kind, title: pool[Math.floor(rnd() * pool.length)], daysAgo: d });
    d += 1 + Math.floor(rnd() * 14);
  }
  return { cpf, phone: fallbackPhone ?? landline, mobile, allergies, exams, timeline };
}

function PatientDetail({
  patient,
  encounters,
  locale,
}: {
  patient: Patient;
  encounters: ReturnType<typeof listEncounters>;
  locale: string;
}) {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const ts = useTranslations('encounterStatus');
  const tf = useTranslations('feedback');
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const T = (loc: Loc) => L(loc[0], loc[1], loc[2], loc[3]);

  const seed = React.useMemo(() => hashSeed(`${patient.id}:${patient.name}`), [patient.id, patient.name]);
  const record = React.useMemo(() => buildRecord(seed, patient.phone), [seed, patient.phone]);
  const now = React.useMemo(() => Date.now(), []);
  const dateFrom = React.useCallback((d: number) => new Date(now - d * 86_400_000), [now]);

  const age = ageFromBirth(patient.birthDate);
  const sexLabel = patient.sex === 'M' ? L('Masculino', 'Male', '男', 'Homme') : L('Feminino', 'Female', '女', 'Femme');

  // editable contact (CPF / phones) — committed via the edit modal
  const [contact, setContact] = React.useState(() => ({ cpf: record.cpf, phone: record.phone, mobile: record.mobile }));
  const [editOpen, setEditOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(contact);
  const openEdit = () => {
    setDraft(contact);
    setEditOpen(true);
  };
  const saveContact = () => {
    setContact(draft);
    setEditOpen(false);
    toast.success(tf('saved'));
  };

  // editable allergies
  const [allergies, setAllergies] = React.useState<string[]>(() => record.allergies.map(T));
  const [newAllergy, setNewAllergy] = React.useState('');
  const addAllergy = () => {
    const v = newAllergy.trim();
    if (!v) return;
    if (!allergies.some((a) => a.toLowerCase() === v.toLowerCase())) {
      setAllergies((list) => [...list, v]);
      toast.success(tf('added'));
    }
    setNewAllergy('');
  };
  const removeAllergy = (a: string) => {
    setAllergies((list) => list.filter((x) => x !== a));
    toast.success(tf('removed'));
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* dados cadastrais */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <SectionTitle>{L('Dados cadastrais', 'Patient details', '患者资料', 'Données du patient')}</SectionTitle>
            <Button size="sm" variant="ghost" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={openEdit}>
              {tc('actions.edit')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl border border-hairline bg-card p-4 shadow-xs">
            <CadField icon={Fingerprint} label={L('CPF', 'CPF', '身份证号', 'CPF')} value={contact.cpf} />
            <CadField
              icon={Cake}
              label={L('Nascimento', 'Date of birth', '出生日期', 'Naissance')}
              value={`${formatDate(patient.birthDate, locale)} · ${t('yearsOld', { age })}`}
            />
            <CadField icon={Phone} label={L('Telefone', 'Phone', '电话', 'Téléphone')} value={contact.phone} />
            <CadField icon={Smartphone} label={L('Celular', 'Mobile', '手机', 'Mobile')} value={contact.mobile} />
            <CadField icon={User} label={L('Sexo', 'Sex', '性别', 'Sexe')} value={sexLabel} />
            <CadField icon={CreditCard} label={t('columns.payer')} value={patient.payer} />
            <CadField
              icon={ShieldCheck}
              label={L('Carteirinha', 'Member ID', '会员卡号', 'N° d’adhérent')}
              value={patient.cardNumber}
            />
            <CadField
              icon={CalendarClock}
              label={t('columns.lastVisit')}
              value={patient.lastVisit ? formatDate(patient.lastVisit, locale) : '—'}
            />
          </div>
        </section>

        {/* consent */}
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-card p-4 shadow-xs">
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
            <p className="text-sm font-medium text-ink/90">{t('columns.consent')}</p>
          </div>
          <Badge tone={CONSENT_TONE[patient.consent]} dot>
            {t(`consent.${patient.consent}`)}
          </Badge>
        </div>

        {/* alergias */}
        <section>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {L('Alergias', 'Allergies', '过敏史', 'Allergies')}
            </span>
          </SectionTitle>
          <div className="mt-2.5 rounded-xl border border-hairline bg-card p-4 shadow-xs">
            {allergies.length === 0 ? (
              <p className="text-sm text-muted">
                {L('Nenhuma alergia registrada', 'No known allergies', '无已知过敏', 'Aucune allergie connue')}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-2xs font-medium text-danger-fg ring-1 ring-inset ring-danger/20 dark:text-danger"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAllergy(a)}
                      aria-label={`${tc('actions.delete')} · ${a}`}
                      className="grid h-4 w-4 place-items-center rounded-full opacity-70 hover:bg-danger/20 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
                placeholder={L('Nova alergia', 'New allergy', '新过敏原', 'Nouvelle allergie')}
                className="h-9"
              />
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={addAllergy}
                disabled={!newAllergy.trim()}
              >
                {tc('actions.addNew')}
              </Button>
            </div>
          </div>
        </section>

        {/* exames recentes */}
        <section>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              {L('Exames recentes', 'Recent exams', '近期检查', 'Examens récents')}
            </span>
          </SectionTitle>
          <ol className="mt-2.5 overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
            {record.exams.map((ex, i) => {
              const meta = EXAM_STATUS_META[ex.status];
              return (
                <li
                  key={ex.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    i !== record.exams.length - 1 && 'border-b border-hairline/60',
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-muted">
                    <FlaskConical className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{T(ex.name)}</p>
                    <p className="text-xs text-muted">{formatDate(dateFrom(ex.daysAgo), locale)}</p>
                  </div>
                  <Badge tone={meta.tone} dot>
                    {T(meta.label)}
                  </Badge>
                </li>
              );
            })}
          </ol>
        </section>

        {/* linha do tempo */}
        <section>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              {L('Linha do tempo', 'Timeline', '时间线', 'Chronologie')}
            </span>
          </SectionTitle>
          <ol className="mt-3">
            {record.timeline.map((ev, i) => {
              const meta = TL_META[ev.kind];
              const Icon = meta.icon;
              const last = i === record.timeline.length - 1;
              return (
                <li key={ev.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {!last && (
                    <span className="absolute left-4 top-8 -bottom-0 w-px bg-hairline" aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-card',
                      TONE_CIRCLE[meta.tone ?? 'neutral'],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-medium">{T(ev.title)}</p>
                      <Badge tone={meta.tone}>{T(meta.label)}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {timeAgo(dateFrom(ev.daysAgo), locale)} · {formatDate(dateFrom(ev.daysAgo), locale)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* histórico de consultas (encounters from the store) */}
        <section>
          <SectionTitle>{t('detail.history')}</SectionTitle>
          {encounters.length === 0 ? (
            <EmptyState icon={<CalendarClock className="h-6 w-6" />} title={t('detail.noEncounters')} className="py-10" />
          ) : (
            <ol className="mt-2.5 overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
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
                  <span className="flex-1 truncate text-sm text-muted">{formatDate(e.scheduledAt, locale)}</span>
                  <Badge tone={STATUS_TONE[e.status]} dot>
                    {ts(e.status)}
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* edit cadastro modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={L('Editar dados cadastrais', 'Edit patient details', '编辑患者资料', 'Modifier les données')}
        size="sm"
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('CPF', 'CPF', '身份证号', 'CPF')}>
            <Input
              value={draft.cpf}
              onChange={(e) => setDraft((d) => ({ ...d, cpf: e.target.value }))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              autoFocus
            />
          </Field>
          <Field label={L('Telefone', 'Phone', '电话', 'Téléphone')}>
            <Input
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              inputMode="tel"
            />
          </Field>
          <Field label={L('Celular', 'Mobile', '手机', 'Mobile')}>
            <Input
              value={draft.mobile}
              onChange={(e) => setDraft((d) => ({ ...d, mobile: e.target.value }))}
              inputMode="tel"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={saveContact}>{tc('actions.save')}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-subtle">{children}</h3>
  );
}

function CadField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-muted">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium tnum">{value}</p>
      </div>
    </div>
  );
}
