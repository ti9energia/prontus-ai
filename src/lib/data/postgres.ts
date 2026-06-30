/**
 * Postgres adapter — write-through in-memory cache over Prisma/Postgres.
 *
 * Same SYNC API as store.ts (all consumers stay identical).
 * Reads   → sync, from in-memory cache shared with store's globalThis.__auronis__.
 * Writes  → sync to memory (via store's mutation functions) + async fire-and-forget to Postgres.
 * Startup → first server-side db() call triggers async hydration from Postgres.
 *
 * This file is only loaded when DATABASE_URL is set (index.ts guards the import).
 * The build stays green without @prisma/client because PrismaClient is require()'d lazily.
 *
 * Activation: set DATABASE_URL + npm i -D prisma && npm i @prisma/client
 *             then npm run db:generate && npm run db:migrate && npx prisma db seed
 */

import type {
  AuditEntry,
  AuditSource,
  ClinicalNote,
  Encounter,
  FeatureFlag,
  Patient,
  Plan,
  Tenant,
  TenantAiConfig,
  TenantWhatsappConfig,
  TenantConnectorConfig,
  TissGuide,
  Template,
  User,
  RoleKey,
} from '../types';

// ─── Lazy Prisma client (require'd at runtime; never at import time) ─────────

type PC = any;

const _PG = globalThis as {
  __pgClient__?: PC;
  __pgHydrateStarted__?: boolean;
};

function getClient(): PC {
  if (!_PG.__pgClient__) {
    const { PrismaClient } = require('@prisma/client'); // lazy — only when DATABASE_URL is set
    _PG.__pgClient__ = new PrismaClient();
  }
  return _PG.__pgClient__;
}

/** Fire-and-forget Postgres write. Errors are logged, never thrown. */
function pgFire(fn: () => Promise<any>): void {
  fn().catch((e: unknown) =>
    console.error('[pg] write failed:', e instanceof Error ? e.message : e),
  );
}

// ─── Re-use store's in-memory state ──────────────────────────────────────────
// store.ts uses globalThis.__auronis__ as its in-memory store.
// postgres.ts hydrates that same object from Postgres so all store reads
// (re-exported below) automatically see the Postgres data after hydration.

import {
  db as _db,
  // Mutation functions we override with write-through:
  pushAudit as _pushAudit,
  addPatient as _addPatient,
  ensureNote as _ensureNote,
  updateNoteSection as _updateNoteSection,
  approveNote as _approveNote,
  createGuideFromEncounter as _createGuideFromEncounter,
  createStandardGuideFromEncounter as _createStandardGuideFromEncounter,
  submitGuide as _submitGuide,
  resubmitGuide as _resubmitGuide,
  requestAuthorization as _requestAuthorization,
  reviewAuthorization as _reviewAuthorization,
  decideAuthorization as _decideAuthorization,
  addOrgUser as _addOrgUser,
  setTenantStatus as _setTenantStatus,
  updateTenantAi as _updateTenantAi,
  updateTenantWhatsapp as _updateTenantWhatsapp,
  upsertTenantConnector as _upsertTenantConnector,
  toggleFlag as _toggleFlag,
  setDefaultTemplate as _setDefaultTemplate,
  duplicateTemplate as _duplicateTemplate,
} from './store';

// ─── Re-export constants and pure reads unchanged ─────────────────────────────
// These functions read from db().* which shares globalThis.__auronis__ with store.
// After hydration, they automatically see Postgres data.
export {
  PAYERS,
  ALL_MODULE_KEYS,
  markDirty,
  persist,
  resetStore,
  getCurrentUser,
  listPatients,
  getPatient,
  listEncounters,
  getEncounter,
  getNote,
  listGuides,
  getGuide,
  getGuideByEncounter,
  getGuideTemplate,
  listTemplates,
  billingStats,
  glossReasons,
  glossTimeSeries,
  agentRecommendations,
  listAudit,
  ownerStats,
  mrrSeries,
  ownerInsights,
  listUsers,
  getUserByEmail,
  listOrgUsers,
  currentOrgId,
  listTenants,
  getTenant,
  listPlans,
  getPlan,
  listFlags,
} from './store';

// ─── db() — triggers hydration on first server-side call ─────────────────────

export function db() {
  const d = _db();
  // In server context (no localStorage), hydrate from Postgres once per process.
  if (typeof window === 'undefined' && !_PG.__pgHydrateStarted__) {
    _PG.__pgHydrateStarted__ = true;
    _hydrateFromPostgres(d).catch((e) =>
      console.error('[pg] hydration failed:', e instanceof Error ? e.message : e),
    );
  }
  return d;
}

// ─── Hydration ───────────────────────────────────────────────────────────────

function toIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function j<T>(v: unknown): T {
  return (v ?? []) as T;
}

function toPatient(r: any): Patient {
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birthDate,
    sex: r.sex as 'M' | 'F',
    payer: r.payer,
    cardNumber: r.cardNumber,
    consent: r.consent as Patient['consent'],
    hue: r.hue ?? 0,
    lastVisit: r.lastVisit ?? undefined,
    phone: r.phone ?? undefined,
  };
}

function toEncounter(r: any): Encounter {
  return {
    id: r.id,
    patientId: r.patientId,
    doctorId: r.doctorId,
    status: r.status as Encounter['status'],
    type: r.type as Encounter['type'],
    specialtyKey: r.specialtyKey,
    scheduledAt: r.scheduledAt,
    startedAt: r.startedAt ?? undefined,
    durationSec: r.durationSec ?? undefined,
    minutesSaved: r.minutesSaved ?? undefined,
    hasNote: !!r.hasNote,
    hasGuide: !!r.hasGuide,
  };
}

function toNote(r: any): ClinicalNote {
  return {
    encounterId: r.encounterId,
    approved: !!r.approved,
    version: r.version ?? 1,
    updatedAt: toIso(r.updatedAt),
    sections: j<ClinicalNote['sections']>(r.sections),
    cids: j<ClinicalNote['cids']>(r.cids),
    procedures: j<ClinicalNote['procedures']>(r.procedures),
  };
}

function toGuide(r: any): TissGuide {
  return {
    id: r.id,
    encounterId: r.encounterId,
    patientId: r.patientId,
    type: r.type as TissGuide['type'],
    payer: r.payer,
    cardNumber: r.cardNumber,
    professional: r.professional,
    council: r.council,
    cbo: r.cbo,
    procedures: j<TissGuide['procedures']>(r.procedures),
    diagnoses: j<TissGuide['diagnoses']>(r.diagnoses),
    status: r.status as TissGuide['status'],
    value: r.value ?? 0,
    currency: r.currency ?? 'BRL',
    glossReasonKey: r.glossReasonKey ?? undefined,
    issues: j<TissGuide['issues']>(r.issues),
    createdAt: toIso(r.createdAt),
    source: r.source ?? undefined,
    authStatus: r.authStatus ?? undefined,
    authNumber: r.authNumber ?? undefined,
    authorizedBy: r.authorizedBy ?? undefined,
  };
}

function toTemplate(r: any): Template {
  return {
    id: r.id,
    specialtyKey: r.specialtyKey,
    payer: r.payer ?? undefined,
    kind: (r.kind ?? 'note') as Template['kind'],
    locale: r.locale as Template['locale'],
    sectionKeys: j<Template['sectionKeys']>(r.sectionKeys),
    procedures: r.procedures ? j<Template['procedures']>(r.procedures) : undefined,
    usedCount: r.usedCount ?? 0,
    isDefault: !!r.isDefault,
  };
}

function toTenant(r: any): Tenant {
  return {
    id: r.id,
    name: r.name,
    planId: r.planId,
    doctors: r.doctors ?? 0,
    usagePct: r.usagePct ?? 0,
    mrr: r.mrr ?? 0,
    status: r.status as Tenant['status'],
    locale: r.locale as Tenant['locale'],
    createdAt: toIso(r.createdAt),
    ai: r.ai ? j<TenantAiConfig>(r.ai) : undefined,
    whatsapp: r.whatsapp ? j<TenantWhatsappConfig>(r.whatsapp) : undefined,
    connectors: r.connectors ? j<TenantConnectorConfig[]>(r.connectors) : undefined,
  };
}

function toUser(r: any): User {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    email: r.email,
    roleKey: r.roleKey as RoleKey,
    status: r.status as User['status'],
    specialtyKey: r.specialtyKey ?? undefined,
    council: r.council ?? undefined,
    locale: r.locale as User['locale'],
    createdAt: toIso(r.createdAt),
  };
}

function toPlan(r: any): Plan {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    currency: r.currency ?? 'BRL',
    popular: r.popular ?? undefined,
    modules: j<string[]>(r.modules),
    quotas: j<Plan['quotas']>(r.quotas),
    featureKeys: j<string[]>(r.featureKeys),
  };
}

function toFlag(r: any): FeatureFlag {
  return {
    module: r.module,
    scope: r.scope as FeatureFlag['scope'],
    enabled: !!r.enabled,
    rollout: r.rollout ?? 100,
  };
}

function toAudit(r: any): AuditEntry {
  return {
    id: r.id,
    at: toIso(r.at),
    actor: r.actor,
    action: r.action,
    target: r.target,
    result: r.result as AuditEntry['result'],
    source: r.source as AuditSource,
  };
}

async function _hydrateFromPostgres(store: any): Promise<void> {
  const pc = getClient();

  const [patients, encounters, notes, guides, templates, tenants, plans, flags, users, audit] =
    await Promise.all([
      pc.patient.findMany({ orderBy: { name: 'asc' } }),
      pc.encounter.findMany({ orderBy: { scheduledAt: 'asc' } }),
      pc.clinicalNote.findMany(),
      pc.tissGuide.findMany({ orderBy: { createdAt: 'desc' } }),
      pc.template.findMany(),
      pc.tenant.findMany({ where: { id: { not: 'platform' } } }),
      pc.plan.findMany(),
      pc.featureFlag.findMany(),
      pc.user.findMany(),
      pc.auditLog.findMany({ orderBy: { at: 'desc' }, take: 200 }),
    ]);

  // Populate the shared in-memory store with Postgres data.
  // All re-exported reads (listPatients, etc.) read from store, so they automatically
  // reflect this data after hydration completes.
  store.patients = patients.map(toPatient);
  store.encounters = encounters.map(toEncounter);
  store.notes = Object.fromEntries(
    notes.map((n: { encounterId: string }) => [n.encounterId, toNote(n)]),
  );
  store.guides = guides.map(toGuide);
  store.templates = templates.map(toTemplate);
  store.tenants = tenants.map(toTenant);
  store.plans = plans.map(toPlan);
  store.flags = flags.map(toFlag);
  store.users = users.map(toUser);
  store.audit = audit.map(toAudit);
}

// ─── Write-through mutations ──────────────────────────────────────────────────

export function pushAudit(
  actor: string,
  action: string,
  target: string,
  result: AuditEntry['result'],
  source: AuditSource,
): void {
  _pushAudit(actor, action, target, result, source);
  pgFire(() =>
    getClient().auditLog.create({
      data: { actor, action, target, result, source, at: new Date() },
    }),
  );
}

export function addPatient(input: { name: string; payer: string }): Patient {
  const patient = _addPatient(input);
  pgFire(() =>
    getClient().patient.create({
      data: {
        id: patient.id,
        orgId: 'ten_0001', // default org; real multi-tenant wiring needs session context
        name: patient.name,
        birthDate: patient.birthDate,
        sex: patient.sex,
        payer: patient.payer,
        cardNumber: patient.cardNumber,
        consent: patient.consent,
        hue: patient.hue,
        phone: patient.phone ?? null,
        lastVisit: patient.lastVisit ?? null,
      },
    }),
  );
  return patient;
}

export function ensureNote(encounterId: string): ClinicalNote {
  const note = _ensureNote(encounterId);
  // Only persist if it was just created (empty sections means new)
  if (note.version === 1 && note.sections.every((s) => !s.content)) {
    pgFire(() =>
      getClient().clinicalNote.upsert({
        where: { encounterId },
        update: {},
        create: {
          encounterId: note.encounterId,
          approved: note.approved,
          version: note.version,
          sections: note.sections,
          cids: note.cids,
          procedures: note.procedures,
        },
      }),
    );
  }
  return note;
}

export function updateNoteSection(
  encounterId: string,
  key: string,
  content: string,
): ClinicalNote {
  const note = _updateNoteSection(encounterId, key, content);
  pgFire(() =>
    getClient().clinicalNote.upsert({
      where: { encounterId },
      update: { sections: note.sections, version: note.version, updatedAt: new Date() },
      create: {
        encounterId: note.encounterId,
        approved: note.approved,
        version: note.version,
        sections: note.sections,
        cids: note.cids,
        procedures: note.procedures,
      },
    }),
  );
  return note;
}

export function approveNote(encounterId: string): ClinicalNote {
  const note = _approveNote(encounterId);
  pgFire(() =>
    getClient().clinicalNote.upsert({
      where: { encounterId },
      update: { approved: true, sections: note.sections },
      create: {
        encounterId: note.encounterId,
        approved: true,
        version: note.version,
        sections: note.sections,
        cids: note.cids,
        procedures: note.procedures,
      },
    }),
  );
  pgFire(() =>
    getClient().encounter.update({
      where: { id: encounterId },
      data: { hasNote: true, status: 'finalized' },
    }),
  );
  return note;
}

function _persistGuide(guide: TissGuide): void {
  pgFire(() =>
    getClient().tissGuide.upsert({
      where: { id: guide.id },
      update: {
        status: guide.status,
        value: guide.value,
        glossReasonKey: guide.glossReasonKey ?? null,
        issues: guide.issues,
        authStatus: guide.authStatus ?? null,
        authNumber: guide.authNumber ?? null,
        authorizedBy: guide.authorizedBy ?? null,
      },
      create: {
        id: guide.id,
        encounterId: guide.encounterId,
        patientId: guide.patientId,
        type: guide.type,
        payer: guide.payer,
        cardNumber: guide.cardNumber,
        professional: guide.professional,
        council: guide.council,
        cbo: guide.cbo,
        procedures: guide.procedures,
        diagnoses: guide.diagnoses,
        status: guide.status,
        value: guide.value,
        currency: guide.currency,
        issues: guide.issues,
        source: guide.source ?? null,
        createdAt: new Date(guide.createdAt),
      },
    }),
  );
}

export function createGuideFromEncounter(encounterId: string): TissGuide {
  const guide = _createGuideFromEncounter(encounterId);
  _persistGuide(guide);
  return guide;
}

export function createStandardGuideFromEncounter(encounterId: string): TissGuide | null {
  const guide = _createStandardGuideFromEncounter(encounterId);
  if (guide) _persistGuide(guide);
  return guide;
}

export function createGuidesFromEncounter(encounterId: string): {
  generated: TissGuide;
  standard: TissGuide | null;
} {
  // Call our overridden versions so Postgres writes happen
  const generated = createGuideFromEncounter(encounterId);
  const standard = createStandardGuideFromEncounter(encounterId);
  return { generated, standard };
}

export function submitGuide(gid: string): TissGuide | undefined {
  const guide = _submitGuide(gid);
  if (guide) {
    pgFire(() =>
      getClient().tissGuide.update({ where: { id: gid }, data: { status: 'sent' } }),
    );
  }
  return guide;
}

export function resubmitGuide(gid: string): TissGuide | undefined {
  const guide = _resubmitGuide(gid);
  if (guide) {
    pgFire(() =>
      getClient().tissGuide.update({
        where: { id: gid },
        data: { status: 'sent', glossReasonKey: null, issues: [] },
      }),
    );
  }
  return guide;
}

export function requestAuthorization(gid: string): TissGuide | undefined {
  const guide = _requestAuthorization(gid);
  if (guide) {
    pgFire(() =>
      getClient().tissGuide.update({
        where: { id: gid },
        data: { authStatus: 'requested' },
      }),
    );
  }
  return guide;
}

export function reviewAuthorization(gid: string): TissGuide | undefined {
  const guide = _reviewAuthorization(gid);
  if (guide) {
    pgFire(() =>
      getClient().tissGuide.update({
        where: { id: gid },
        data: { authStatus: 'in_review' },
      }),
    );
  }
  return guide;
}

export function decideAuthorization(
  gid: string,
  decision: 'authorized' | 'denied',
  authNumber?: string,
): TissGuide | undefined {
  const guide = _decideAuthorization(gid, decision, authNumber);
  if (guide) {
    pgFire(() =>
      getClient().tissGuide.update({
        where: { id: gid },
        data: {
          authStatus: decision,
          authNumber: guide.authNumber ?? null,
          authorizedBy: guide.authorizedBy ?? null,
        },
      }),
    );
  }
  return guide;
}

export function addOrgUser(
  orgId: string,
  input: { name: string; email: string; roleKey: RoleKey },
): User {
  const user = _addOrgUser(orgId, input);
  pgFire(() =>
    getClient().user.create({
      data: {
        id: user.id,
        orgId,
        name: user.name,
        email: user.email,
        roleKey: user.roleKey,
        status: user.status,
        locale: user.locale,
      },
    }),
  );
  return user;
}

export function setTenantStatus(
  tid: string,
  status: Tenant['status'],
): Tenant | undefined {
  const tenant = _setTenantStatus(tid, status);
  if (tenant) {
    pgFire(() =>
      getClient().tenant.update({ where: { id: tid }, data: { status } }),
    );
  }
  return tenant;
}

export function updateTenantAi(
  id: string,
  patch: Partial<TenantAiConfig>,
): TenantAiConfig | undefined {
  const ai = _updateTenantAi(id, patch);
  if (ai) {
    pgFire(() => getClient().tenant.update({ where: { id }, data: { ai } }));
  }
  return ai;
}

export function updateTenantWhatsapp(
  id: string,
  patch: Partial<TenantWhatsappConfig>,
): TenantWhatsappConfig | undefined {
  const whatsapp = _updateTenantWhatsapp(id, patch);
  if (whatsapp) {
    pgFire(() => getClient().tenant.update({ where: { id }, data: { whatsapp } }));
  }
  return whatsapp;
}

export function upsertTenantConnector(
  id: string,
  conn: TenantConnectorConfig,
): TenantConnectorConfig[] | undefined {
  const connectors = _upsertTenantConnector(id, conn);
  if (connectors) {
    pgFire(() => getClient().tenant.update({ where: { id }, data: { connectors } }));
  }
  return connectors;
}

export function toggleFlag(module: string): FeatureFlag | undefined {
  const flag = _toggleFlag(module);
  if (flag) {
    pgFire(() =>
      getClient().featureFlag.update({
        where: { module },
        data: { enabled: flag.enabled },
      }),
    );
  }
  return flag;
}

export function setDefaultTemplate(tid: string): Template | undefined {
  const tpl = _setDefaultTemplate(tid);
  pgFire(() =>
    getClient().template.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
  );
  if (tpl) {
    pgFire(() =>
      getClient().template.update({ where: { id: tid }, data: { isDefault: true } }),
    );
  }
  return tpl;
}

export function duplicateTemplate(tid: string): Template | undefined {
  const tpl = _duplicateTemplate(tid);
  if (tpl) {
    pgFire(() =>
      getClient().template.create({
        data: {
          id: tpl.id,
          specialtyKey: tpl.specialtyKey,
          payer: tpl.payer ?? null,
          kind: tpl.kind ?? 'note',
          locale: tpl.locale,
          sectionKeys: tpl.sectionKeys,
          procedures: tpl.procedures ?? null,
          usedCount: 0,
          isDefault: false,
        },
      }),
    );
  }
  return tpl;
}

