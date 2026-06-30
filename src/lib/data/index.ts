/**
 * Data-layer seam (Block 8 / B10).
 *
 * WITHOUT DATABASE_URL → in-memory + localStorage store (default, no setup needed).
 * WITH DATABASE_URL    → Postgres write-through adapter via Prisma.
 *
 * This is the SINGLE switch point. All app code imports from `@/lib/data`.
 * Never import from `./store` or `./postgres` directly in non-test code.
 *
 * To activate Postgres:
 *   1. Provision Neon/Supabase → set DATABASE_URL (Vercel env vars).
 *   2. npm i -D prisma && npm i @prisma/client
 *   3. npm run db:generate && npm run db:migrate
 *   4. npx prisma db seed
 *   See prisma/seed.ts and src/lib/data/PERSISTENCE.md.
 */

import * as _storeModule from './store';

type Adapter = typeof _storeModule;

// Resolved once at module load to avoid per-call env checks.
// NODE_ENV=test always uses the store so unit tests never need a real DB.
const _adapter: Adapter = (() => {
  if (process.env.NODE_ENV !== 'test' && process.env.DATABASE_URL) {
    try {
      const pg = require('./postgres') as Adapter;
      return pg;
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[auronis:data] DATABASE_URL is set but Postgres adapter failed to load ' +
            '— falling back to in-memory store. ' +
            'Run: npm i -D prisma && npm i @prisma/client && npm run db:generate',
          e instanceof Error ? e.message : '',
        );
      }
    }
  }
  return _storeModule;
})();

// Re-export all types from the store (always available for TypeScript consumers).
export type * from './store';

// ─── Named function/value exports (all delegate to the active adapter) ────────
// If you add a new export to store.ts, add it here too.

export const PAYERS = _adapter.PAYERS;
export const ALL_MODULE_KEYS = _adapter.ALL_MODULE_KEYS;

export const db = _adapter.db;
export const markDirty = _adapter.markDirty;
export const persist = _adapter.persist;
export const resetStore = _adapter.resetStore;

export const getCurrentUser = _adapter.getCurrentUser;

export const listPatients = _adapter.listPatients;
export const getPatient = _adapter.getPatient;
export const addPatient = _adapter.addPatient;

export const listEncounters = _adapter.listEncounters;
export const getEncounter = _adapter.getEncounter;

export const getNote = _adapter.getNote;
export const ensureNote = _adapter.ensureNote;
export const updateNoteSection = _adapter.updateNoteSection;
export const approveNote = _adapter.approveNote;

export const listGuides = _adapter.listGuides;
export const getGuide = _adapter.getGuide;
export const getGuideByEncounter = _adapter.getGuideByEncounter;
export const getGuideTemplate = _adapter.getGuideTemplate;
export const createGuideFromEncounter = _adapter.createGuideFromEncounter;
export const createStandardGuideFromEncounter = _adapter.createStandardGuideFromEncounter;
export const createGuidesFromEncounter = _adapter.createGuidesFromEncounter;
export const submitGuide = _adapter.submitGuide;
export const resubmitGuide = _adapter.resubmitGuide;
export const requestAuthorization = _adapter.requestAuthorization;
export const reviewAuthorization = _adapter.reviewAuthorization;
export const decideAuthorization = _adapter.decideAuthorization;

export const listTemplates = _adapter.listTemplates;
export const setDefaultTemplate = _adapter.setDefaultTemplate;
export const duplicateTemplate = _adapter.duplicateTemplate;

export const listLabOrders = _adapter.listLabOrders;
export const getLabOrder = _adapter.getLabOrder;
export const addLabOrder = _adapter.addLabOrder;
export const updateLabOrderStatus = _adapter.updateLabOrderStatus;

export const billingStats = _adapter.billingStats;
export const glossReasons = _adapter.glossReasons;
export const glossTimeSeries = _adapter.glossTimeSeries;

export const agentRecommendations = _adapter.agentRecommendations;

export const listAudit = _adapter.listAudit;
export const pushAudit = _adapter.pushAudit;

export const ownerStats = _adapter.ownerStats;
export const mrrSeries = _adapter.mrrSeries;
export const ownerInsights = _adapter.ownerInsights;

export const listUsers = _adapter.listUsers;
export const getUserByEmail = _adapter.getUserByEmail;
export const listOrgUsers = _adapter.listOrgUsers;
export const currentOrgId = _adapter.currentOrgId;
export const addOrgUser = _adapter.addOrgUser;

export const listTenants = _adapter.listTenants;
export const getTenant = _adapter.getTenant;
export const setTenantStatus = _adapter.setTenantStatus;
export const updateTenantAi = _adapter.updateTenantAi;
export const updateTenantWhatsapp = _adapter.updateTenantWhatsapp;
export const upsertTenantConnector = _adapter.upsertTenantConnector;

export const listPlans = _adapter.listPlans;
export const getPlan = _adapter.getPlan;

export const listFlags = _adapter.listFlags;
export const toggleFlag = _adapter.toggleFlag;

export const listApiKeys = _adapter.listApiKeys;
export const getApiKeyByHash = _adapter.getApiKeyByHash;
export const addApiKey = _adapter.addApiKey;
export const revokeApiKey = _adapter.revokeApiKey;
