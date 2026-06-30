/**
 * Prisma seed — populates an empty Auronis Health database with the same
 * starter data as the in-memory store (store.ts).
 *
 * Run:  npx prisma db seed
 * Requires DATABASE_URL to be set.
 *
 * The seed is idempotent: it skips records that already exist (upsert).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAYERS = ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Hapvida'];

function id(prefix: string, n: number): string {
  return `${prefix}_${n.toString().padStart(4, '0')}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function atToday(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function main(): Promise<void> {
  console.log('🌱 Seeding Auronis Health database…');

  // ── Platform tenant (for the owner user) ─────────────────────────────────
  await prisma.tenant.upsert({
    where: { id: 'platform' },
    update: {},
    create: {
      id: 'platform',
      name: 'Auronis Health Platform',
      planId: 'plan_scale',
      doctors: 0,
      usagePct: 0,
      mrr: 0,
      status: 'active',
      locale: 'pt-BR',
    },
  });

  // ── Plans ─────────────────────────────────────────────────────────────────
  const plans = [
    {
      id: 'plan_starter',
      name: 'Starter',
      price: 99,
      currency: 'BRL',
      popular: false,
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
      modules: [
        'encounters',
        'transcription',
        'clinical-notes',
        'tiss',
        'patients',
        'billing',
        'templates',
        'copilot',
        'agent',
      ],
      quotas: { doctors: 25, minutes: 6000, whatsapp: true },
      featureKeys: ['live', 'note', 'tiss', 'gloss', 'copilot', 'whatsapp'],
    },
    {
      id: 'plan_scale',
      name: 'Scale',
      price: 349,
      currency: 'BRL',
      popular: false,
      modules: [
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
      ],
      quotas: { doctors: 'unlimited', minutes: 'unlimited', whatsapp: true },
      featureKeys: ['live', 'note', 'tiss', 'gloss', 'copilot', 'whatsapp'],
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }

  // ── Feature flags ─────────────────────────────────────────────────────────
  const allModules = [
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
  for (let i = 0; i < allModules.length; i++) {
    const m = allModules[i];
    await prisma.featureFlag.upsert({
      where: { module: m },
      update: {},
      create: {
        module: m,
        scope: i % 3 === 0 ? 'global' : i % 3 === 1 ? 'plan' : 'tenant',
        enabled: true,
        rollout: m === 'agent' ? 60 : m === 'whatsapp' ? 80 : 100,
      },
    });
  }

  // ── Tenants ───────────────────────────────────────────────────────────────
  const tenantData: Array<
    [string, string, string, number, number, number, string, number]
  > = [
    ['ten_0001', 'Clínica Aurora', 'plan_pro', 12, 64, 2388, 'active', 120],
    ['ten_0002', 'Hospital São Lucas', 'plan_scale', 48, 71, 9552, 'active', 240],
    ['ten_0003', 'Instituto Cardio+', 'plan_pro', 9, 52, 1791, 'active', 90],
    ['ten_0004', 'Rede Vida Saúde', 'plan_scale', 31, 88, 6169, 'past_due', 300],
    ['ten_0005', 'Clínica Bem Estar', 'plan_starter', 4, 39, 396, 'trial', 12],
    ['ten_0006', 'Núcleo Ortopédico', 'plan_pro', 7, 47, 1393, 'active', 150],
    ['ten_0007', 'Derma Premium', 'plan_starter', 3, 22, 297, 'trial', 8],
    ['ten_0008', 'Materno Infantil RS', 'plan_pro', 11, 58, 2189, 'suspended', 200],
  ];

  for (const [tid, name, planId, doctors, usagePct, mrr, status, agoDays] of tenantData) {
    await prisma.tenant.upsert({
      where: { id: tid },
      update: {},
      create: {
        id: tid,
        name,
        planId,
        doctors,
        usagePct,
        mrr,
        status,
        locale: 'pt-BR',
        createdAt: new Date(daysAgo(agoDays)),
      },
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = [
    { id: 'usr_owner', orgId: 'platform', name: 'Owner', email: 'owner@auronishealth.com', roleKey: 'owner' },
    { id: 'usr_doc_1', orgId: 'ten_0001', name: 'Dra. Helena Vasconcelos', email: 'helena@clinicaaurora.com.br', roleKey: 'medico', specialtyKey: 'clinica', council: 'CRM-SP 142.857' },
    { id: 'usr_fat_1', orgId: 'ten_0001', name: 'Patrícia Lopes', email: 'patricia@clinicaaurora.com.br', roleKey: 'faturista' },
    { id: 'usr_ges_1', orgId: 'ten_0001', name: 'Ricardo Alves', email: 'ricardo@clinicaaurora.com.br', roleKey: 'gestor' },
    { id: 'usr_vie_1', orgId: 'ten_0001', name: 'Camila Duarte', email: 'camila@clinicaaurora.com.br', roleKey: 'viewer' },
    { id: 'usr_adm_2', orgId: 'ten_0002', name: 'Dr. Admin Hospital', email: 'admin@saolucas.com.br', roleKey: 'org_admin' },
    { id: 'usr_doc_2a', orgId: 'ten_0002', name: 'Dr. Paulo Restrepo', email: 'paulo@saolucas.com.br', roleKey: 'medico' },
    { id: 'usr_doc_2b', orgId: 'ten_0002', name: 'Dra. Sônia Maia', email: 'sonia@saolucas.com.br', roleKey: 'medico' },
    { id: 'usr_fat_2', orgId: 'ten_0002', name: 'Equipe Faturamento', email: 'faturamento@saolucas.com.br', roleKey: 'faturista' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        orgId: user.orgId,
        name: user.name,
        email: user.email,
        roleKey: user.roleKey,
        status: 'active',
        specialtyKey: user.specialtyKey ?? null,
        council: user.council ?? null,
        locale: 'pt-BR',
        createdAt: new Date(daysAgo(30)),
      },
    });
  }

  // ── Patients ──────────────────────────────────────────────────────────────
  const patientData: Array<[string, string, 'M' | 'F', string, string, string, number, number]> = [
    [id('pat', 1), 'Marina Albuquerque', 'F', '1989-03-12', 'Unimed', '0001 4567 8901 2345', 4, 1],
    [id('pat', 2), 'Rafael Tavares', 'M', '1976-11-02', 'Bradesco Saúde', '0044 1122 3344 5566', 9, 2],
    [id('pat', 3), 'Helena Costa', 'F', '2018-06-21', 'SulAmérica', '0078 9900 1122 3344', 2, 3],
    [id('pat', 4), 'João Pedro Martins', 'M', '1995-01-30', 'Amil', '0090 8877 6655 4433', 30, 4],
    [id('pat', 5), 'Beatriz Nogueira', 'F', '1962-09-15', 'Hapvida', '0012 3456 7788 9900', 14, 5],
    [id('pat', 6), 'Carlos Eduardo Lima', 'M', '1958-04-08', 'Unimed', '0001 7788 9900 1122', 7, 6],
    [id('pat', 7), 'Sofia Ribeiro', 'F', '2001-12-19', 'SulAmérica', '0078 3344 5566 7788', 60, 7],
    [id('pat', 8), 'Antônio Ferreira', 'M', '1949-07-25', 'Bradesco Saúde', '0044 5566 7788 9900', 1, 8],
    [id('pat', 9), 'Larissa Gomes', 'F', '1992-02-14', 'Amil', '0090 1122 3344 5566', 21, 9],
    [id('pat', 10), 'Gabriel Souza', 'M', '1985-10-03', 'Unimed', '0001 9988 7766 5544', 45, 10],
  ];

  for (const [pid, name, sex, birthDate, payer, cardNumber, lastVisitDays, idx] of patientData) {
    await prisma.patient.upsert({
      where: { id: pid },
      update: {},
      create: {
        id: pid,
        orgId: 'ten_0001',
        name,
        birthDate,
        sex,
        payer,
        cardNumber,
        consent: idx % 7 === 0 ? 'pending' : 'granted',
        hue: ((idx - 1) * 47) % 360,
        lastVisit: daysAgo(lastVisitDays),
        phone: `+55 11 9${(80000000 + idx * 13713).toString().slice(0, 8)}`,
      },
    });
  }

  // ── Encounters ────────────────────────────────────────────────────────────
  const encData = [
    { id: id('enc', 1), patientId: id('pat', 6), type: 'followUp', specialtyKey: 'cardio', status: 'finalized', h: 8, minutesSaved: 16, hasNote: true, hasGuide: true },
    { id: id('enc', 2), patientId: id('pat', 2), type: 'followUp', specialtyKey: 'clinica', status: 'finalized', h: 8, m: 40, minutesSaved: 14, hasNote: true, hasGuide: true },
    { id: id('enc', 3), patientId: id('pat', 1), type: 'followUp', specialtyKey: 'clinica', status: 'review', h: 9, minutesSaved: 15, hasNote: true, hasGuide: false },
    { id: id('enc', 4), patientId: id('pat', 4), type: 'firstVisit', specialtyKey: 'ortopedia', status: 'draft', h: 9, m: 40, minutesSaved: 12, hasNote: true, hasGuide: false },
    { id: id('enc', 5), patientId: id('pat', 3), type: 'urgent', specialtyKey: 'pediatria', status: 'scheduled', h: 10, m: 20, hasNote: false, hasGuide: false },
    { id: id('enc', 6), patientId: id('pat', 9), type: 'telemedicine', specialtyKey: 'dermato', status: 'scheduled', h: 11, hasNote: false, hasGuide: false },
    { id: id('enc', 7), patientId: id('pat', 5), type: 'followUp', specialtyKey: 'dermato', status: 'scheduled', h: 11, m: 40, hasNote: false, hasGuide: false },
    { id: id('enc', 8), patientId: id('pat', 7), type: 'firstVisit', specialtyKey: 'gineco', status: 'scheduled', h: 14, hasNote: false, hasGuide: false },
    { id: id('enc', 9), patientId: id('pat', 10), type: 'followUp', specialtyKey: 'clinica', status: 'scheduled', h: 14, m: 40, hasNote: false, hasGuide: false },
    { id: id('enc', 10), patientId: id('pat', 8), type: 'followUp', specialtyKey: 'cardio', status: 'scheduled', h: 15, m: 30, hasNote: false, hasGuide: false },
  ];

  for (const e of encData) {
    const scheduled = atToday(e.h, e.m ?? 0);
    await prisma.encounter.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        patientId: e.patientId,
        doctorId: 'usr_doc_1',
        status: e.status,
        type: e.type,
        specialtyKey: e.specialtyKey,
        scheduledAt: scheduled,
        startedAt:
          e.status === 'finalized' || e.status === 'review' || e.status === 'draft'
            ? scheduled
            : null,
        durationSec: e.minutesSaved ? (e.minutesSaved + 6) * 60 : null,
        minutesSaved: e.minutesSaved ?? null,
        hasNote: e.hasNote,
        hasGuide: e.hasGuide,
      },
    });
  }

  // ── Clinical note for enc_0003 (Marina Albuquerque) ───────────────────────
  const noteSections = [
    { key: 'queixa', content: 'Cefaleia occipital recorrente há cerca de 2 semanas, associada a tontura matinal.', inferred: true, confidence: 0.94, approved: true },
    { key: 'hma', content: 'Refere cefaleia de predomínio matinal, pulsátil, intensidade 6/10. Aferição domiciliar de PA elevada (150/95 mmHg). Em uso irregular de losartana 50 mg/dia.', inferred: true, confidence: 0.89, approved: false },
    { key: 'exame', content: 'PA 152/96 mmHg, FC 78 bpm, eupneica. Ausculta cardíaca: ritmo regular, bulhas normofonéticas, sem sopros.', inferred: true, confidence: 0.91, approved: false },
    { key: 'hipoteses', content: 'Hipertensão arterial sistêmica com controle inadequado.', inferred: true, confidence: 0.86, approved: false },
    { key: 'conduta', content: 'Ajuste de losartana para 50 mg 12/12h. Solicito ECG e perfil laboratorial. Orientações dietéticas e MAPA. Retorno em 30 dias.', inferred: true, confidence: 0.83, approved: false },
  ];

  await prisma.clinicalNote.upsert({
    where: { encounterId: id('enc', 3) },
    update: {},
    create: {
      encounterId: id('enc', 3),
      approved: false,
      version: 3,
      sections: noteSections,
      cids: [{ code: 'I10', label: 'Hipertensão essencial (primária)', confidence: 0.92 }],
      procedures: [
        { code: '10101012', label: 'Consulta em consultório', confidence: 0.98 },
        { code: '40901360', label: 'Eletrocardiograma convencional (ECG)', confidence: 0.79 },
      ],
    },
  });

  // ── TISS guides ───────────────────────────────────────────────────────────
  const guideBase = {
    type: 'consulta',
    professional: 'Dra. Helena Vasconcelos',
    council: 'CRM-SP 142.857',
    cbo: '225125',
    currency: 'BRL',
  };

  const guidesData = [
    { id: id('gui', 1), encounterId: id('enc', 1), patientId: id('pat', 6), payer: 'Unimed', type: 'sadt', status: 'paid', value: 360, procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }, { code: '40901360', description: 'Eletrocardiograma (ECG)', qty: 1, value: 180 }], diagnoses: [{ code: 'I25', label: 'Doença isquêmica crônica do coração' }], createdAt: daysAgo(6), cardNumber: '0001 7788 9900 1122', issues: [] },
    { id: id('gui', 2), encounterId: id('enc', 2), patientId: id('pat', 2), payer: 'Bradesco Saúde', type: 'consulta', status: 'paid', value: 180, procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }], diagnoses: [{ code: 'E11', label: 'Diabetes mellitus tipo 2' }], createdAt: daysAgo(5), cardNumber: '0044 1122 3344 5566', issues: [] },
    { id: id('gui', 3), encounterId: id('enc', 4), patientId: id('pat', 4), payer: 'Amil', type: 'sadt', status: 'glossed', value: 420, glossReasonKey: 'missingAuth', procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }, { code: '40808014', description: 'Ressonância magnética de coluna lombar', qty: 1, value: 240 }], diagnoses: [{ code: 'M54.5', label: 'Dor lombar baixa' }], createdAt: daysAgo(4), cardNumber: '0090 8877 6655 4433', issues: [{ id: 'iss1', fieldKey: 'procedures', messageKey: 'authNeeded', severity: 'high' }] },
    { id: id('gui', 4), encounterId: id('enc', 1), patientId: id('pat', 5), payer: 'Hapvida', type: 'consulta', status: 'glossed', value: 180, glossReasonKey: 'codeMismatch', procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }], diagnoses: [{ code: 'L20', label: 'Dermatite atópica' }], createdAt: daysAgo(3), cardNumber: '0012 3456 7788 9900', issues: [{ id: 'iss2', fieldKey: 'diagnoses', messageKey: 'missingCid', severity: 'high' }] },
    { id: id('gui', 5), encounterId: id('enc', 1), patientId: id('pat', 8), payer: 'Bradesco Saúde', type: 'sadt', status: 'sent', value: 540, procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }, { code: '40901360', description: 'Eletrocardiograma (ECG)', qty: 1, value: 180 }, { code: '40304361', description: 'Hemograma completo', qty: 1, value: 180 }], diagnoses: [{ code: 'I10', label: 'Hipertensão essencial' }], createdAt: daysAgo(1), cardNumber: '0044 5566 7788 9900', issues: [] },
    { id: id('gui', 6), encounterId: id('enc', 1), patientId: id('pat', 9), payer: 'Amil', type: 'consulta', status: 'glossed', value: 180, glossReasonKey: 'expiredCard', procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }], diagnoses: [{ code: 'J06.9', label: 'Infecção aguda das vias aéreas superiores' }], createdAt: daysAgo(8), cardNumber: '0090 1122 3344 5566', issues: [] },
    { id: id('gui', 7), encounterId: id('enc', 1), patientId: id('pat', 10), payer: 'Unimed', type: 'consulta', status: 'sent', value: 180, procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }], diagnoses: [{ code: 'E78', label: 'Distúrbios do metabolismo de lipoproteínas' }], createdAt: daysAgo(1), cardNumber: '0001 9988 7766 5544', issues: [] },
    { id: id('gui', 8), encounterId: id('enc', 1), patientId: id('pat', 7), payer: 'SulAmérica', type: 'consulta', status: 'paid', value: 180, procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }], diagnoses: [{ code: 'Z00', label: 'Exame médico geral' }], createdAt: daysAgo(7), cardNumber: '0078 3344 5566 7788', issues: [] },
  ];

  for (const g of guidesData) {
    await prisma.tissGuide.upsert({
      where: { id: g.id },
      update: {},
      create: {
        ...guideBase,
        id: g.id,
        encounterId: g.encounterId,
        patientId: g.patientId,
        type: g.type,
        payer: g.payer,
        cardNumber: g.cardNumber,
        procedures: g.procedures,
        diagnoses: g.diagnoses,
        status: g.status,
        value: g.value,
        glossReasonKey: g.glossReasonKey ?? null,
        issues: g.issues,
        createdAt: new Date(g.createdAt),
      },
    });
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  const specs = ['clinica', 'cardio', 'pediatria', 'ortopedia', 'dermato', 'gineco'];
  for (let i = 0; i < specs.length; i++) {
    await prisma.template.upsert({
      where: { id: id('tpl', i + 1) },
      update: {},
      create: {
        id: id('tpl', i + 1),
        specialtyKey: specs[i],
        kind: 'note',
        locale: 'pt-BR',
        sectionKeys: ['queixa', 'hma', 'exame', 'hipoteses', 'conduta'],
        usedCount: [128, 86, 54, 41, 33, 27][i],
        isDefault: i === 0,
      },
    });
  }

  // Guide templates (one per payer)
  for (let i = 0; i < PAYERS.length; i++) {
    await prisma.template.upsert({
      where: { id: id('gtpl', i + 1) },
      update: {},
      create: {
        id: id('gtpl', i + 1),
        specialtyKey: 'clinica',
        payer: PAYERS[i],
        kind: 'guide',
        locale: 'pt-BR',
        sectionKeys: [],
        procedures: [{ code: '10101012', description: 'Consulta em consultório', qty: 1, value: 180 }],
        usedCount: 0,
        isDefault: false,
      },
    });
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  const auditRows = [
    { minsAgo: 4, actor: 'Dra. Helena Vasconcelos', action: 'note.approve', target: `Encounter ${id('enc', 1)}`, result: 'ok', source: 'ui' },
    { minsAgo: 9, actor: 'Mari (IA)', action: 'tiss.create', target: `Guide ${id('gui', 1)}`, result: 'ok', source: 'ai' },
    { minsAgo: 16, actor: 'Dra. Helena Vasconcelos', action: 'tiss.submit', target: `Guide ${id('gui', 5)}`, result: 'ok', source: 'ui' },
    { minsAgo: 27, actor: 'Mari (IA)', action: 'agent.recommend', target: `Guide ${id('gui', 3)}`, result: 'pending', source: 'ai' },
    { minsAgo: 41, actor: 'faturista@aurora', action: 'tiss.resubmit', target: `Guide ${id('gui', 6)}`, result: 'ok', source: 'whatsapp' },
    { minsAgo: 63, actor: 'platform_owner', action: 'tenant.impersonate', target: 'Tenant ten_0001', result: 'ok', source: 'ui' },
    { minsAgo: 88, actor: 'sistema', action: 'audio.purge', target: `Encounter ${id('enc', 2)}`, result: 'ok', source: 'system' },
    { minsAgo: 140, actor: 'Mari (IA)', action: 'note.update', target: `Encounter ${id('enc', 3)}`, result: 'blocked', source: 'ai' },
  ];

  for (let i = 0; i < auditRows.length; i++) {
    const row = auditRows[i];
    await prisma.auditLog.upsert({
      where: { id: id('aud', i + 1) },
      update: {},
      create: {
        id: id('aud', i + 1),
        at: new Date(Date.now() - row.minsAgo * 60 * 1000),
        actor: row.actor,
        action: row.action,
        target: row.target,
        result: row.result,
        source: row.source,
      },
    });
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
