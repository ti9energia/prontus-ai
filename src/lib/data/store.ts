import type {
  AgentRecommendation,
  AuditEntry,
  AuditSource,
  ClinicalNote,
  CurrentUser,
  Encounter,
  FeatureFlag,
  OwnerStats,
  Patient,
  Plan,
  SeriesPoint,
  Tenant,
  TenantAiConfig,
  TenantWhatsappConfig,
  TenantConnectorConfig,
  TissGuide,
  Template,
  User,
  RoleKey,
} from '../types';

/* ============================================================
   In-memory database. A clean repository layer that reads like
   a real backend and could be swapped for Prisma/Postgres later.
   Persisted on globalThis to survive Next dev hot-reloads.
   ============================================================ */

interface DB {
  user: CurrentUser;
  patients: Patient[];
  encounters: Encounter[];
  notes: Record<string, ClinicalNote>;
  guides: TissGuide[];
  templates: Template[];
  audit: AuditEntry[];
  tenants: Tenant[];
  plans: Plan[];
  flags: FeatureFlag[];
  users: User[];
}

export const PAYERS = ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Hapvida'];

function atToday(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function id(prefix: string, n: number) {
  return `${prefix}_${n.toString().padStart(4, '0')}`;
}

function seedPatients(): Patient[] {
  const raw: Array<[string, string, 'M' | 'F', string, string]> = [
    ['Marina Albuquerque', '1989-03-12', 'F', 'Unimed', '0001 4567 8901 2345'],
    ['Rafael Tavares', '1976-11-02', 'M', 'Bradesco Saúde', '0044 1122 3344 5566'],
    ['Helena Costa', '2018-06-21', 'F', 'SulAmérica', '0078 9900 1122 3344'],
    ['João Pedro Martins', '1995-01-30', 'M', 'Amil', '0090 8877 6655 4433'],
    ['Beatriz Nogueira', '1962-09-15', 'F', 'Hapvida', '0012 3456 7788 9900'],
    ['Carlos Eduardo Lima', '1958-04-08', 'M', 'Unimed', '0001 7788 9900 1122'],
    ['Sofia Ribeiro', '2001-12-19', 'F', 'SulAmérica', '0078 3344 5566 7788'],
    ['Antônio Ferreira', '1949-07-25', 'M', 'Bradesco Saúde', '0044 5566 7788 9900'],
    ['Larissa Gomes', '1992-02-14', 'F', 'Amil', '0090 1122 3344 5566'],
    ['Gabriel Souza', '1985-10-03', 'M', 'Unimed', '0001 9988 7766 5544'],
  ];
  return raw.map((r, i) => ({
    id: id('pat', i + 1),
    name: r[0],
    birthDate: r[1],
    sex: r[2],
    payer: r[3],
    cardNumber: r[4],
    consent: i % 7 === 0 ? 'pending' : 'granted',
    hue: (i * 47) % 360,
    lastVisit: daysAgo([4, 9, 2, 30, 14, 7, 60, 1, 21, 45][i]),
    phone: `+55 11 9${(80000000 + i * 13713).toString().slice(0, 8)}`,
  }));
}

const NOTE_MARINA = (): ClinicalNote => ({
  encounterId: id('enc', 3),
  approved: false,
  version: 3,
  updatedAt: atToday(9, 12),
  sections: [
    {
      key: 'queixa',
      content: 'Cefaleia occipital recorrente há cerca de 2 semanas, associada a tontura matinal.',
      inferred: true,
      confidence: 0.94,
      approved: true,
    },
    {
      key: 'hma',
      content:
        'Refere cefaleia de predomínio matinal, pulsátil, intensidade 6/10, sem náuseas ou fotofobia. Nega alteração visual. Aferição domiciliar de PA persistentemente elevada (em torno de 150/95 mmHg). Em uso irregular de losartana 50 mg/dia.',
      inferred: true,
      confidence: 0.89,
      approved: false,
    },
    {
      key: 'exame',
      content:
        'PA 152/96 mmHg, FC 78 bpm, eupneica, afebril. Ausculta cardíaca: ritmo regular, 2 tempos, bulhas normofonéticas, sem sopros. Ausculta pulmonar limpa. Sem edema de membros inferiores.',
      inferred: true,
      confidence: 0.91,
      approved: false,
    },
    {
      key: 'hipoteses',
      content: 'Hipertensão arterial sistêmica com controle inadequado.',
      inferred: true,
      confidence: 0.86,
      approved: false,
    },
    {
      key: 'conduta',
      content:
        'Ajuste de losartana para 50 mg 12/12h. Solicito ECG de repouso e perfil laboratorial (função renal, eletrólitos, lipidograma). Orientações dietéticas (restrição de sódio) e MAPA. Retorno em 30 dias.',
      inferred: true,
      confidence: 0.83,
      approved: false,
    },
  ],
  cids: [{ code: 'I10', label: 'Hipertensão essencial (primária)', confidence: 0.92 }],
  procedures: [
    { code: '10101012', label: 'Consulta em consultório', confidence: 0.98 },
    { code: '40901360', label: 'Eletrocardiograma convencional (ECG)', confidence: 0.79 },
  ],
});

function seedEncounters(): Encounter[] {
  const docId = 'usr_doc_1';
  const list: Array<Partial<Encounter> & { h: number; m?: number }> = [
    { patientId: id('pat', 6), type: 'followUp', specialtyKey: 'cardio', status: 'finalized', h: 8, minutesSaved: 16, hasNote: true, hasGuide: true },
    { patientId: id('pat', 2), type: 'followUp', specialtyKey: 'clinica', status: 'finalized', h: 8, m: 40, minutesSaved: 14, hasNote: true, hasGuide: true },
    { patientId: id('pat', 1), type: 'followUp', specialtyKey: 'clinica', status: 'review', h: 9, minutesSaved: 15, hasNote: true, hasGuide: false },
    { patientId: id('pat', 4), type: 'firstVisit', specialtyKey: 'ortopedia', status: 'draft', h: 9, m: 40, minutesSaved: 12, hasNote: true, hasGuide: false },
    { patientId: id('pat', 3), type: 'urgent', specialtyKey: 'pediatria', status: 'scheduled', h: 10, m: 20, hasNote: false, hasGuide: false },
    { patientId: id('pat', 9), type: 'telemedicine', specialtyKey: 'dermato', status: 'scheduled', h: 11, hasNote: false, hasGuide: false },
    { patientId: id('pat', 5), type: 'followUp', specialtyKey: 'dermato', status: 'scheduled', h: 11, m: 40, hasNote: false, hasGuide: false },
    { patientId: id('pat', 7), type: 'firstVisit', specialtyKey: 'gineco', status: 'scheduled', h: 14, hasNote: false, hasGuide: false },
    { patientId: id('pat', 10), type: 'followUp', specialtyKey: 'clinica', status: 'scheduled', h: 14, m: 40, hasNote: false, hasGuide: false },
    { patientId: id('pat', 8), type: 'followUp', specialtyKey: 'cardio', status: 'scheduled', h: 15, m: 30, hasNote: false, hasGuide: false },
  ];
  return list.map((e, i) => ({
    id: id('enc', i + 1),
    patientId: e.patientId!,
    doctorId: docId,
    status: e.status!,
    type: e.type!,
    specialtyKey: e.specialtyKey!,
    scheduledAt: atToday(e.h, e.m ?? 0),
    startedAt: e.status === 'finalized' || e.status === 'review' || e.status === 'draft' ? atToday(e.h, e.m ?? 0) : undefined,
    durationSec: e.minutesSaved ? (e.minutesSaved + 6) * 60 : undefined,
    minutesSaved: e.minutesSaved,
    hasNote: !!e.hasNote,
    hasGuide: !!e.hasGuide,
  }));
}

function seedGuides(): TissGuide[] {
  const base = (over: Partial<TissGuide>): TissGuide => ({
    id: 'guide',
    encounterId: '',
    patientId: '',
    type: 'consulta',
    payer: 'Unimed',
    cardNumber: '0001 4567 8901 2345',
    professional: 'Dra. Helena Vasconcelos',
    council: 'CRM-SP 142.857',
    cbo: '225125',
    procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }],
    diagnoses: [{ code: 'I10', label: 'Hipertensão essencial' }],
    status: 'sent',
    value: 180,
    currency: 'BRL',
    issues: [],
    createdAt: daysAgo(2),
    ...over,
  });
  return [
    base({ id: id('gui', 1), encounterId: id('enc', 1), patientId: id('pat', 6), payer: 'Unimed', type: 'sadt', status: 'paid', value: 360, procedures: [ { code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }, { code: '40901360', description: 'Eletrocardiograma (ECG)', qty: 1, value: 180 } ], diagnoses: [{ code: 'I25', label: 'Doença isquêmica crônica do coração' }], createdAt: daysAgo(6) }),
    base({ id: id('gui', 2), encounterId: id('enc', 2), patientId: id('pat', 2), payer: 'Bradesco Saúde', status: 'paid', value: 180, diagnoses: [{ code: 'E11', label: 'Diabetes mellitus tipo 2' }], createdAt: daysAgo(5) }),
    base({ id: id('gui', 3), encounterId: id('enc', 0), patientId: id('pat', 4), payer: 'Amil', type: 'sadt', status: 'glossed', value: 420, glossReasonKey: 'missingAuth', procedures: [ { code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }, { code: '40808014', description: 'Ressonância magnética de coluna lombar', qty: 1, value: 240 } ], diagnoses: [{ code: 'M54.5', label: 'Dor lombar baixa' }], issues: [ { id: 'iss1', fieldKey: 'procedures', messageKey: 'authNeeded', severity: 'high' } ], createdAt: daysAgo(4) }),
    base({ id: id('gui', 4), patientId: id('pat', 5), encounterId: id('enc', 0), payer: 'Hapvida', status: 'glossed', value: 180, glossReasonKey: 'codeMismatch', diagnoses: [{ code: 'L20', label: 'Dermatite atópica' }], issues: [ { id: 'iss2', fieldKey: 'diagnoses', messageKey: 'missingCid', severity: 'high' } ], createdAt: daysAgo(3) }),
    base({ id: id('gui', 5), patientId: id('pat', 8), encounterId: id('enc', 0), payer: 'Bradesco Saúde', type: 'sadt', status: 'sent', value: 540, procedures: [ { code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }, { code: '40901360', description: 'Eletrocardiograma (ECG)', qty: 1, value: 180 }, { code: '40304361', description: 'Hemograma completo', qty: 1, value: 180 } ], diagnoses: [{ code: 'I10', label: 'Hipertensão essencial' }], createdAt: daysAgo(1) }),
    base({ id: id('gui', 6), patientId: id('pat', 9), encounterId: id('enc', 0), payer: 'Amil', status: 'glossed', value: 180, glossReasonKey: 'expiredCard', diagnoses: [{ code: 'J06.9', label: 'Infecção aguda das vias aéreas superiores' }], issues: [], createdAt: daysAgo(8) }),
    base({ id: id('gui', 7), patientId: id('pat', 10), encounterId: id('enc', 0), payer: 'Unimed', status: 'sent', value: 180, diagnoses: [{ code: 'E78', label: 'Distúrbios do metabolismo de lipoproteínas' }], createdAt: daysAgo(1) }),
    base({ id: id('gui', 8), patientId: id('pat', 7), encounterId: id('enc', 0), payer: 'SulAmérica', status: 'paid', value: 180, diagnoses: [{ code: 'Z00', label: 'Exame médico geral' }], createdAt: daysAgo(7) }),
  ];
}

function seedTemplates(): Template[] {
  const specs = ['clinica', 'cardio', 'pediatria', 'ortopedia', 'dermato', 'gineco'];
  return specs.map((s, i) => ({
    id: id('tpl', i + 1),
    specialtyKey: s,
    locale: 'pt-BR',
    sectionKeys: ['queixa', 'hma', 'exame', 'hipoteses', 'conduta'],
    usedCount: [128, 86, 54, 41, 33, 27][i],
    isDefault: i === 0,
  }));
}

function seedGuideTemplates(): Template[] {
  // One pre-configured "standard" TISS guide per payer (the doctor's per-convênio default).
  return PAYERS.map((payer, i) => ({
    id: id('gtpl', i + 1),
    specialtyKey: 'clinica',
    payer,
    kind: 'guide',
    locale: 'pt-BR',
    sectionKeys: [],
    procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }],
    usedCount: 0,
    isDefault: false,
  }));
}

function seedTenants(): Tenant[] {
  const raw: Array<[string, string, number, number, number, Tenant['status']]> = [
    ['Clínica Aurora', 'plan_pro', 12, 64, 2388, 'active'],
    ['Hospital São Lucas', 'plan_scale', 48, 71, 9552, 'active'],
    ['Instituto Cardio+', 'plan_pro', 9, 52, 1791, 'active'],
    ['Rede Vida Saúde', 'plan_scale', 31, 88, 6169, 'past_due'],
    ['Clínica Bem Estar', 'plan_starter', 4, 39, 396, 'trial'],
    ['Núcleo Ortopédico', 'plan_pro', 7, 47, 1393, 'active'],
    ['Derma Premium', 'plan_starter', 3, 22, 297, 'trial'],
    ['Materno Infantil RS', 'plan_pro', 11, 58, 2189, 'suspended'],
  ];
  return raw.map((r, i) => ({
    id: id('ten', i + 1),
    name: r[0],
    planId: r[1],
    doctors: r[2],
    usagePct: r[3],
    mrr: r[4],
    status: r[5],
    locale: 'pt-BR',
    createdAt: daysAgo([120, 240, 90, 300, 12, 150, 8, 200][i]),
  }));
}

function seedUsers(): User[] {
  const mk = (id_: string, orgId: string, name: string, email: string, roleKey: RoleKey): User => ({
    id: id_,
    orgId,
    name,
    email,
    roleKey,
    status: 'active',
    locale: 'pt-BR',
    createdAt: daysAgo(30),
  });
  return [
    mk('usr_owner', 'platform', 'Owner', 'owner@auronishealth.com', 'owner'),
    // Clínica Aurora (ten_0001)
    mk('usr_doc_1', 'ten_0001', 'Dra. Helena Vasconcelos', 'helena@clinicaaurora.com.br', 'medico'),
    mk('usr_fat_1', 'ten_0001', 'Patrícia Lopes', 'patricia@clinicaaurora.com.br', 'faturista'),
    mk('usr_ges_1', 'ten_0001', 'Ricardo Alves', 'ricardo@clinicaaurora.com.br', 'gestor'),
    mk('usr_vie_1', 'ten_0001', 'Camila Duarte', 'camila@clinicaaurora.com.br', 'viewer'),
    // Hospital São Lucas (ten_0002) — multi-doctor org for the hospital login (Block 5)
    mk('usr_adm_2', 'ten_0002', 'Dr. Admin Hospital', 'admin@saolucas.com.br', 'org_admin'),
    mk('usr_doc_2a', 'ten_0002', 'Dr. Paulo Restrepo', 'paulo@saolucas.com.br', 'medico'),
    mk('usr_doc_2b', 'ten_0002', 'Dra. Sônia Maia', 'sonia@saolucas.com.br', 'medico'),
    mk('usr_fat_2', 'ten_0002', 'Equipe Faturamento', 'faturamento@saolucas.com.br', 'faturista'),
  ];
}

const ALL_MODULES = [
  'encounters',
  'transcription',
  'clinical-notes',
  'tiss',
  'patients',
  'billing',
  'templates',
  'integrations',
  'copilot',
  'agent',
  'whatsapp',
];

function seedPlans(): Plan[] {
  return [
    {
      id: 'plan_starter',
      name: 'Starter',
      price: 99,
      currency: 'BRL',
      modules: ['encounters', 'transcription', 'clinical-notes', 'patients', 'copilot'],
      quotas: { doctors: 3, minutes: 1200, whatsapp: false },
      featureKeys: ['live', 'note', 'copilot'],
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      price: 199,
      currency: 'BRL',
      popular: true,
      modules: ['encounters', 'transcription', 'clinical-notes', 'tiss', 'patients', 'billing', 'templates', 'copilot', 'agent'],
      quotas: { doctors: 25, minutes: 6000, whatsapp: true },
      featureKeys: ['live', 'note', 'tiss', 'gloss', 'copilot', 'whatsapp'],
    },
    {
      id: 'plan_scale',
      name: 'Scale',
      price: 349,
      currency: 'BRL',
      modules: ALL_MODULES,
      quotas: { doctors: 'unlimited', minutes: 'unlimited', whatsapp: true },
      featureKeys: ['live', 'note', 'tiss', 'gloss', 'copilot', 'whatsapp'],
    },
  ];
}

function seedFlags(): FeatureFlag[] {
  return ALL_MODULES.map((m, i) => ({
    module: m,
    scope: i % 3 === 0 ? 'global' : i % 3 === 1 ? 'plan' : 'tenant',
    enabled: true,
    rollout: m === 'agent' ? 60 : m === 'whatsapp' ? 80 : 100,
  }));
}

function seedAudit(): AuditEntry[] {
  const rows: Array<[number, string, string, string, AuditEntry['result'], AuditSource]> = [
    [4, 'Dra. Helena Vasconcelos', 'note.approve', 'Encounter enc_0001', 'ok', 'ui'],
    [9, 'Mari (IA)', 'tiss.create', 'Guide gui_0001', 'ok', 'ai'],
    [16, 'Dra. Helena Vasconcelos', 'tiss.submit', 'Guide gui_0005', 'ok', 'ui'],
    [27, 'Mari (IA)', 'agent.recommend', 'Guide gui_0003', 'pending', 'ai'],
    [41, 'faturista@aurora', 'tiss.resubmit', 'Guide gui_0006', 'ok', 'whatsapp'],
    [63, 'platform_owner', 'tenant.impersonate', 'Tenant ten_0001', 'ok', 'ui'],
    [88, 'sistema', 'audio.purge', 'Encounter enc_0002', 'ok', 'system'],
    [140, 'Mari (IA)', 'note.update', 'Encounter enc_0003', 'blocked', 'ai'],
  ];
  return rows.map((r, i) => ({
    id: id('aud', i + 1),
    at: new Date(Date.now() - r[0] * 60 * 1000).toISOString(),
    actor: r[1],
    action: r[2],
    target: r[3],
    result: r[4],
    source: r[5],
  }));
}

function seed(): DB {
  return {
    user: {
      id: 'usr_doc_1',
      name: 'Dra. Helena Vasconcelos',
      roleKey: 'medico',
      specialtyKey: 'clinica',
      council: 'CRM-SP 142.857',
      email: 'helena@clinicaaurora.com.br',
      locale: 'pt-BR',
      orgName: 'Clínica Aurora',
      planName: 'Scale',
    },
    patients: seedPatients(),
    encounters: seedEncounters(),
    notes: { [id('enc', 3)]: NOTE_MARINA() },
    guides: seedGuides(),
    templates: [...seedTemplates(), ...seedGuideTemplates()],
    audit: seedAudit(),
    tenants: seedTenants(),
    plans: seedPlans(),
    flags: seedFlags(),
    users: seedUsers(),
  };
}

const g = globalThis as unknown as {
  __auronis__?: DB;
  __auronisPersist__?: boolean;
  __auronisInterval__?: number;
};

/* Client-side persistence — snapshot the store to localStorage so a user's data
   survives reloads in their browser, no database required. On the server (API
   routes / RSC) there is no localStorage, so it falls back to the in-memory seed
   per runtime. For production multi-device persistence, plug a Postgres adapter
   gated on DATABASE_URL — see src/lib/data/PERSISTENCE.md. */
const SNAPSHOT_KEY = 'auronis:store:v2';

function hydrate(): DB {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const snap = JSON.parse(raw) as DB;
        // Shape guard: only trust a snapshot that looks like a real DB.
        if (snap && snap.user && Array.isArray(snap.patients) && Array.isArray(snap.guides)) {
          return snap;
        }
      }
    } catch {
      /* corrupt snapshot — fall through to a fresh seed */
    }
  }
  return seed();
}

/* Dirty flag so the idle auto-persist tick skips the (potentially expensive)
   full-snapshot JSON.stringify when nothing changed since the last write. */
let storeDirty = true;
/** Mark the store as changed so the next persist tick flushes it. */
export function markDirty(): void {
  storeDirty = true;
}

function writeSnapshot(): void {
  if (typeof window === 'undefined' || !g.__auronis__) return;
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(g.__auronis__));
    storeDirty = false;
  } catch {
    /* quota or serialization error — ignore, the in-memory store still works */
  }
}

/** Idle/interval persist — only writes when something actually changed. */
export function persist(): void {
  if (!storeDirty) return;
  writeSnapshot();
}

/** Force a flush regardless of the dirty flag (tab hide / unload — never lose data). */
function forcePersist(): void {
  writeSnapshot();
}

/** Reset the store to the seed and clear the persisted snapshot (client only). */
export function resetStore(): void {
  g.__auronis__ = seed();
  storeDirty = true;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(SNAPSHOT_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function db(): DB {
  if (!g.__auronis__) {
    g.__auronis__ = hydrate();
    // Wire client-side auto-persist once: periodic + on tab hide / unload.
    if (typeof window !== 'undefined' && !g.__auronisPersist__) {
      g.__auronisPersist__ = true;
      // Idle tick is cheap (skips when clean); unload/hide force a flush so nothing is lost.
      g.__auronisInterval__ = window.setInterval(persist, 4000);
      window.addEventListener('beforeunload', () => {
        forcePersist();
        if (g.__auronisInterval__) window.clearInterval(g.__auronisInterval__);
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') forcePersist();
      });
    }
  }
  return g.__auronis__;
}

/* ----------------------------- Repository ----------------------------- */

export function getCurrentUser() {
  return db().user;
}

export function listPatients() {
  return db().patients;
}
export function getPatient(pid: string) {
  return db().patients.find((p) => p.id === pid);
}

export function listEncounters() {
  return db().encounters;
}
export function getEncounter(eid: string) {
  return db().encounters.find((e) => e.id === eid);
}

export function getNote(encounterId: string) {
  return db().notes[encounterId];
}
export function ensureNote(encounterId: string): ClinicalNote {
  const d = db();
  if (!d.notes[encounterId]) {
    d.notes[encounterId] = {
      encounterId,
      approved: false,
      version: 1,
      updatedAt: new Date().toISOString(),
      sections: (['queixa', 'hma', 'exame', 'hipoteses', 'conduta'] as const).map((key) => ({
        key,
        content: '',
        inferred: false,
        confidence: 0,
        approved: false,
      })),
      cids: [],
      procedures: [],
    };
  }
  return d.notes[encounterId];
}

export function updateNoteSection(encounterId: string, key: string, content: string) {
  const note = ensureNote(encounterId);
  const sec = note.sections.find((s) => s.key === key);
  if (sec) {
    sec.content = content;
    sec.inferred = false;
    sec.approved = false;
  }
  note.version += 1;
  note.updatedAt = new Date().toISOString();
  pushAudit('Dra. Helena Vasconcelos', 'note.update', `Encounter ${encounterId}`, 'ok', 'ui');
  return note;
}

export function approveNote(encounterId: string) {
  const note = ensureNote(encounterId);
  note.approved = true;
  note.sections.forEach((s) => (s.approved = true));
  const enc = getEncounter(encounterId);
  if (enc) {
    enc.hasNote = true;
    enc.status = 'finalized';
  }
  pushAudit('Dra. Helena Vasconcelos', 'note.approve', `Encounter ${encounterId}`, 'ok', 'ui');
  return note;
}

export function listGuides() {
  return db().guides;
}
export function getGuide(gid: string) {
  return db().guides.find((g2) => g2.id === gid);
}
export function getGuideByEncounter(encounterId: string) {
  return db().guides.find((g2) => g2.encounterId === encounterId);
}

export function createGuideFromEncounter(encounterId: string): TissGuide {
  const d = db();
  const existing = getGuideByEncounterSource(encounterId, 'generated');
  if (existing) return existing;
  const enc = getEncounter(encounterId);
  const note = getNote(encounterId);
  const patient = enc ? getPatient(enc.patientId) : undefined;
  const guide: TissGuide = {
    id: id('gui', d.guides.length + 1),
    encounterId,
    patientId: patient?.id ?? '',
    type: 'consulta',
    payer: patient?.payer ?? 'Unimed',
    cardNumber: patient?.cardNumber ?? '',
    professional: d.user.name,
    council: d.user.council,
    cbo: '225125',
    procedures: (note?.procedures ?? [{ code: '10101012', label: 'Consulta em consultório', confidence: 1 }]).map((p) => ({
      code: p.code,
      description: p.label,
      qty: 1,
      value: 180, // mock flat price; real TUSS pricing table is a future connector
    })),
    diagnoses: (note?.cids ?? []).map((c) => ({ code: c.code, label: c.label })),
    status: 'draft',
    value: 0,
    currency: 'BRL',
    issues: [],
    createdAt: new Date().toISOString(),
    source: 'generated',
  };
  guide.value = guide.procedures.reduce((s, p) => s + p.value * p.qty, 0);
  // simple pre-gloss validation
  if (guide.diagnoses.length === 0) {
    guide.issues.push({ id: 'iv1', fieldKey: 'diagnoses', messageKey: 'missingCid', severity: 'high' });
  }
  d.guides.unshift(guide);
  if (enc) enc.hasGuide = true;
  pushAudit('Mari (IA)', 'tiss.create', `Guide ${guide.id}`, 'ok', 'ai');
  return guide;
}

function getGuideByEncounterSource(encounterId: string, source: 'standard' | 'generated') {
  return db().guides.find(
    (g2) => g2.encounterId === encounterId && (g2.source ?? 'generated') === source,
  );
}

/** The pre-configured standard guide template for a payer (falls back to the first). */
export function getGuideTemplate(payer: string): Template | undefined {
  const guides = db().templates.filter((t) => t.kind === 'guide');
  return guides.find((t) => t.payer === payer) ?? guides[0];
}

/** Build the per-payer STANDARD guide for an encounter (idempotent by source). */
export function createStandardGuideFromEncounter(encounterId: string): TissGuide | null {
  const d = db();
  const existing = getGuideByEncounterSource(encounterId, 'standard');
  if (existing) return existing;
  const enc = getEncounter(encounterId);
  const patient = enc ? getPatient(enc.patientId) : undefined;
  if (!patient) return null;
  const tpl = getGuideTemplate(patient.payer);
  if (!tpl?.procedures?.length) return null;
  const guide: TissGuide = {
    id: id('gui', d.guides.length + 1),
    encounterId,
    patientId: patient.id,
    type: 'consulta',
    payer: patient.payer,
    cardNumber: patient.cardNumber,
    professional: d.user.name,
    council: d.user.council,
    cbo: '225125',
    procedures: tpl.procedures.map((p) => ({ ...p })),
    diagnoses: [],
    status: 'draft',
    value: tpl.procedures.reduce((s, p) => s + p.value * p.qty, 0),
    currency: 'BRL',
    issues: [],
    createdAt: new Date().toISOString(),
    source: 'standard',
  };
  d.guides.unshift(guide);
  if (enc) enc.hasGuide = true;
  tpl.usedCount += 1;
  pushAudit(d.user.name, 'tiss.createStandard', `Guide ${guide.id}`, 'ok', 'ui');
  return guide;
}

/** On convênio selection: generate BOTH the standard (configured) and the app-generated guide. */
export function createGuidesFromEncounter(encounterId: string): {
  generated: TissGuide;
  standard: TissGuide | null;
} {
  const generated = createGuideFromEncounter(encounterId);
  const standard = createStandardGuideFromEncounter(encounterId);
  return { generated, standard };
}

export function submitGuide(gid: string) {
  const guide = getGuide(gid);
  if (guide) {
    guide.status = 'sent';
    pushAudit('Dra. Helena Vasconcelos', 'tiss.submit', `Guide ${guide.id}`, 'ok', 'ui');
  }
  return guide;
}

export function resubmitGuide(gid: string) {
  const guide = getGuide(gid);
  if (guide) {
    guide.status = 'sent';
    guide.glossReasonKey = undefined;
    guide.issues = [];
    pushAudit('Dra. Helena Vasconcelos', 'tiss.resubmit', `Guide ${guide.id}`, 'ok', 'ui');
  }
  return guide;
}

/* --------------------- Requisition / prior authorization --------------------- */
export function requestAuthorization(gid: string) {
  const g = getGuide(gid);
  if (g) {
    g.authStatus = 'requested';
    pushAudit(db().user.name, 'requisition.request', `Guide ${g.id}`, 'ok', 'ui');
  }
  return g;
}
export function reviewAuthorization(gid: string) {
  const g = getGuide(gid);
  if (g) {
    g.authStatus = 'in_review';
    pushAudit(db().user.name, 'requisition.review', `Guide ${g.id}`, 'ok', 'ui');
  }
  return g;
}
export function decideAuthorization(gid: string, decision: 'authorized' | 'denied', authNumber?: string) {
  const g = getGuide(gid);
  if (g) {
    g.authStatus = decision;
    if (decision === 'authorized') {
      g.authNumber = authNumber ?? `AUT-${g.id.slice(-4)}`;
      g.authorizedBy = db().user.name;
    }
    pushAudit(db().user.name, `requisition.${decision}`, `Guide ${g.id}`, decision === 'authorized' ? 'ok' : 'blocked', 'ui');
  }
  return g;
}

export function listTemplates() {
  return db().templates;
}

/* ----------------------------- Billing ----------------------------- */

export function billingStats() {
  const guides = listGuides();
  const submitted = guides.filter((g2) => g2.status !== 'draft').length;
  const paid = guides.filter((g2) => g2.status === 'paid');
  const glossed = guides.filter((g2) => g2.status === 'glossed');
  const glossRate = submitted ? glossed.length / submitted : 0;
  const recovered = paid.reduce((s, g2) => s + g2.value, 0);
  const atRisk = glossed.reduce((s, g2) => s + g2.value, 0);
  return {
    submitted,
    paid: paid.length,
    glossed: glossed.length,
    glossRate,
    recovered,
    atRisk,
    currency: 'BRL',
  };
}

export function glossReasons() {
  const guides = listGuides().filter((g2) => g2.status === 'glossed');
  const counts: Record<string, number> = {};
  for (const g2 of guides) {
    const key = g2.glossReasonKey ?? 'missingDoc';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  // ensure a few representative reasons appear
  const base: Record<string, number> = { missingAuth: 3, codeMismatch: 2, expiredCard: 2, duplicate: 1, missingDoc: 1 };
  for (const k of Object.keys(counts)) base[k] = (base[k] ?? 0) + counts[k];
  return Object.entries(base).map(([key, value]) => ({ key, value }));
}

export function glossTimeSeries(): SeriesPoint[] {
  // gloss rate per month, before vs after Auronis adoption
  const months = ['M-5', 'M-4', 'M-3', 'M-2', 'M-1', 'M'];
  const submitted = [120, 132, 128, 140, 151, 162];
  const glossedBefore = [22, 24, 23, 0, 0, 0];
  const glossedAfter = [0, 0, 0, 14, 9, 5];
  return months.map((m, i) => ({
    label: m,
    submitted: submitted[i],
    before: glossedBefore[i],
    after: glossedAfter[i],
  }));
}

/* ----------------------------- Agent ----------------------------- */

export function agentRecommendations(): AgentRecommendation[] {
  return [
    {
      id: 'rec_1',
      category: 'gloss',
      titleKey: 'preGloss',
      descKey: 'preGloss',
      params: { patient: 'João Pedro Martins' },
      impact: 420,
      confidence: 0.91,
      guideId: id('gui', 3),
    },
    {
      id: 'rec_2',
      category: 'resubmit',
      titleKey: 'resubmit',
      descKey: 'resubmit',
      params: { patient: 'Larissa Gomes' },
      impact: 180,
      confidence: 0.84,
      guideId: id('gui', 6),
    },
    {
      id: 'rec_3',
      category: 'incomplete',
      titleKey: 'incomplete',
      descKey: 'incomplete',
      params: { patient: 'João Pedro Martins' },
      impact: 180,
      confidence: 0.77,
      encounterId: id('enc', 4),
    },
  ];
}

/* ----------------------------- Audit ----------------------------- */

export function listAudit() {
  // Stable, antisymmetric comparator (return 0 on ties) so same-millisecond
  // entries keep a deterministic order; newest first.
  return [...db().audit].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
export function pushAudit(
  actor: string,
  action: string,
  target: string,
  result: AuditEntry['result'],
  source: AuditSource,
) {
  const d = db();
  d.audit.unshift({
    id: id('aud', d.audit.length + 1),
    at: new Date().toISOString(),
    actor,
    action,
    target,
    result,
    source,
  });
  markDirty();
}

/* ----------------------------- Owner ----------------------------- */

export function ownerStats(): OwnerStats {
  const tenants = db().tenants;
  return {
    mrr: tenants.reduce((s, t) => s + t.mrr, 0),
    mrrGrowth: 0.184,
    activeTenants: tenants.filter((t) => t.status === 'active' || t.status === 'trial').length,
    activeDoctors: tenants.reduce((s, t) => s + t.doctors, 0),
    minutesProcessed: 184_320,
    aiSpend: 2_140,
    errorRate: 0.004,
    churn: 0.021,
    currency: 'BRL',
  };
}

export function mrrSeries(): SeriesPoint[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const mrr = [8200, 11400, 14800, 17900, 21300, 24675];
  return months.map((m, i) => ({ label: m, mrr: mrr[i] }));
}

/** Strategic, owner-facing rollup powering Mari's owner console. */
export function ownerInsights() {
  const stats = ownerStats();
  const tenants = listTenants();
  const atRisk = tenants.filter((t) => t.status === 'past_due' || t.status === 'suspended');
  const trials = tenants.filter((t) => t.status === 'trial');
  const upsell = tenants.filter((t) => t.planId !== 'plan_scale' && t.usagePct >= 80);
  const highUsage = [...tenants].sort((a, b) => b.usagePct - a.usagePct).slice(0, 3);
  return { stats, atRisk, trials, upsell, highUsage, tenantCount: tenants.length };
}

export function listUsers() {
  return db().users;
}
export function getUserByEmail(email: string): User | undefined {
  const e = email.trim().toLowerCase();
  return db().users.find((u) => u.email.toLowerCase() === e);
}
export function listOrgUsers(orgId: string) {
  return db().users.filter((u) => u.orgId === orgId);
}

export function listTenants() {
  return db().tenants;
}
export function listPlans() {
  return db().plans;
}
export function getPlan(pid: string) {
  return db().plans.find((p) => p.id === pid);
}
export function listFlags() {
  return db().flags;
}
export function toggleFlag(module: string) {
  const f = db().flags.find((x) => x.module === module);
  if (f) f.enabled = !f.enabled;
  markDirty();
  return f;
}
export function setTenantStatus(tid: string, status: Tenant['status']) {
  const t = db().tenants.find((x) => x.id === tid);
  if (t) {
    t.status = status;
    pushAudit('platform_owner', `tenant.${status}`, `Tenant ${tid}`, 'ok', 'ui');
  }
  return t;
}

export function getTenant(id: string) {
  return db().tenants.find((t) => t.id === id);
}

/** Owner configures a tenant's Mari on their behalf (persisted + audited). */
export function updateTenantAi(id: string, patch: Partial<TenantAiConfig>) {
  const t = getTenant(id);
  if (!t) return undefined;
  t.ai = {
    persona: 'Mari',
    model: 'claude-opus-4-8',
    autonomy: 'semi',
    monthlyBudget: 2500,
    enabledTools: [],
    ...t.ai,
    ...patch,
  };
  pushAudit('platform_owner', 'tenant.ai.update', `Tenant ${id}`, 'ok', 'ui');
  return t.ai;
}

/** Owner configures a tenant's WhatsApp channel on their behalf. */
export function updateTenantWhatsapp(id: string, patch: Partial<TenantWhatsappConfig>) {
  const t = getTenant(id);
  if (!t) return undefined;
  t.whatsapp = {
    enabled: true,
    number: '',
    persona: 'Mari',
    commands: [],
    perTenant: true,
    ...t.whatsapp,
    ...patch,
  };
  pushAudit('platform_owner', 'tenant.whatsapp.update', `Tenant ${id}`, 'ok', 'ui');
  return t.whatsapp;
}

/** Enable/configure a connector for a tenant (idempotent by connector id). */
export function upsertTenantConnector(id: string, conn: TenantConnectorConfig) {
  const t = getTenant(id);
  if (!t) return undefined;
  t.connectors = t.connectors ?? [];
  const idx = t.connectors.findIndex((c) => c.id === conn.id);
  if (idx >= 0) t.connectors[idx] = conn;
  else t.connectors.push(conn);
  pushAudit('platform_owner', 'tenant.connector.upsert', `Tenant ${id}`, 'ok', 'ui');
  return t.connectors;
}

/* ----------------------------- Templates (mutations) ----------------------------- */
export function setDefaultTemplate(tid: string) {
  const d = db();
  d.templates.forEach((tpl) => (tpl.isDefault = tpl.id === tid));
  pushAudit('Dra. Helena Vasconcelos', 'template.setDefault', `Template ${tid}`, 'ok', 'ui');
  return d.templates.find((tpl) => tpl.id === tid);
}
export function duplicateTemplate(tid: string): Template | undefined {
  const d = db();
  const src = d.templates.find((tpl) => tpl.id === tid);
  if (!src) return undefined;
  const copy: Template = { ...src, id: id('tpl', d.templates.length + 1), isDefault: false, usedCount: 0 };
  d.templates.push(copy);
  pushAudit('Dra. Helena Vasconcelos', 'template.duplicate', `Template ${copy.id}`, 'ok', 'ui');
  return copy;
}

/* ----------------------------- Patients (mutations) ----------------------------- */
export function addPatient(input: { name: string; payer: string }): Patient {
  const d = db();
  const n = d.patients.length + 1;
  const patient: Patient = {
    id: id('pat', n),
    name: input.name.trim() || `Paciente ${n}`,
    birthDate: '1990-01-01',
    sex: 'F',
    payer: input.payer.trim() || 'Unimed',
    cardNumber: '0000 0000 0000 0000',
    consent: 'pending',
    hue: (n * 47) % 360,
  };
  d.patients.unshift(patient);
  pushAudit('Dra. Helena Vasconcelos', 'patient.create', `Patient ${patient.id}`, 'ok', 'ui');
  return patient;
}

export const ALL_MODULE_KEYS = ALL_MODULES;
