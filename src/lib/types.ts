/**
 * Auronis Health — domain model.
 * Mirrors the entities described in the spec (Encounter, ClinicalNote, TissGuide,
 * Patient, Billing, Template, Tenant, Plan, FeatureFlag, AuditLog…).
 * Strings that are user-facing labels are stored as i18n KEYS, not text,
 * so the same record renders in all four locales.
 */

export type Locale = 'pt-BR' | 'en' | 'zh-CN' | 'fr-FR';

export type EncounterStatus = 'scheduled' | 'recording' | 'draft' | 'review' | 'finalized';
export type EncounterType = 'firstVisit' | 'followUp' | 'urgent' | 'telemedicine';
export type GuideStatus = 'draft' | 'sent' | 'paid' | 'glossed';
export type GuideType = 'consulta' | 'sadt' | 'internacao';
export type ConsentStatus = 'granted' | 'pending' | 'revoked';
export type IssueSeverity = 'high' | 'medium' | 'low';

export type NoteSectionKey = 'queixa' | 'hma' | 'exame' | 'hipoteses' | 'conduta';

export interface Patient {
  id: string;
  name: string;
  birthDate: string; // ISO
  sex: 'M' | 'F';
  payer: string;
  cardNumber: string;
  consent: ConsentStatus;
  hue: number; // for deterministic avatar color
  lastVisit?: string; // ISO
  phone?: string;
}

export interface NoteSection {
  key: NoteSectionKey;
  content: string;
  inferred: boolean;
  confidence: number; // 0..1
  approved: boolean;
}

export interface CodedItem {
  code: string;
  label: string;
  confidence: number;
}

export interface ClinicalNote {
  encounterId: string;
  sections: NoteSection[];
  cids: CodedItem[];
  procedures: CodedItem[];
  version: number;
  updatedAt: string;
  approved: boolean;
}

export interface Encounter {
  id: string;
  patientId: string;
  doctorId: string;
  status: EncounterStatus;
  type: EncounterType;
  specialtyKey: string;
  scheduledAt: string; // ISO
  startedAt?: string;
  durationSec?: number;
  minutesSaved?: number;
  hasNote: boolean;
  hasGuide: boolean;
}

export interface TissProcedure {
  code: string; // TUSS
  description: string;
  qty: number;
  value: number;
}

export interface TissDiagnosis {
  code: string; // CID-10
  label: string;
}

export interface TissIssue {
  id: string;
  fieldKey: string;
  messageKey: string;
  severity: IssueSeverity;
}

export interface TissGuide {
  id: string;
  encounterId: string;
  patientId: string;
  type: GuideType;
  payer: string;
  cardNumber: string;
  professional: string;
  council: string; // e.g. CRM-SP 123456
  cbo: string;
  procedures: TissProcedure[];
  diagnoses: TissDiagnosis[];
  status: GuideStatus;
  value: number;
  currency: string;
  glossReasonKey?: string;
  issues: TissIssue[];
  createdAt: string;
  /** Whether this guide is the app-generated one or the pre-configured per-payer standard. */
  source?: 'standard' | 'generated';
}

export interface Template {
  id: string;
  specialtyKey: string;
  /** Payer/convênio this standard template targets (guide templates only). */
  payer?: string;
  /** 'note' = clinical-note template (default), 'guide' = standard TISS guide per payer. */
  kind?: 'note' | 'guide';
  locale: Locale;
  sectionKeys: NoteSectionKey[];
  /** Pre-configured procedures for a standard guide template. */
  procedures?: TissProcedure[];
  usedCount: number;
  isDefault: boolean;
}

export type AgentCategory = 'gloss' | 'resubmit' | 'incomplete' | 'template';

export interface AgentRecommendation {
  id: string;
  category: AgentCategory;
  titleKey: string;
  descKey: string;
  params: Record<string, string | number>;
  impact: number; // currency value of impact
  confidence: number; // 0..1
  encounterId?: string;
  guideId?: string;
}

export type AuditSource = 'ui' | 'ai' | 'whatsapp' | 'api' | 'system';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  result: 'ok' | 'blocked' | 'pending';
  source: AuditSource;
}

/* ----------------------------- Owner / SaaS ----------------------------- */

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'past_due';

export interface Tenant {
  id: string;
  name: string;
  planId: string;
  doctors: number;
  usagePct: number;
  mrr: number;
  status: TenantStatus;
  locale: Locale;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  popular?: boolean;
  modules: string[];
  quotas: { doctors: number | 'unlimited'; minutes: number | 'unlimited'; whatsapp: boolean };
  featureKeys: string[];
}

export type FlagScope = 'global' | 'plan' | 'tenant';

export interface FeatureFlag {
  module: string;
  scope: FlagScope;
  enabled: boolean;
  rollout: number; // 0..100
}

export interface OwnerStats {
  mrr: number;
  mrrGrowth: number;
  activeTenants: number;
  activeDoctors: number;
  minutesProcessed: number;
  aiSpend: number;
  errorRate: number;
  churn: number;
  currency: string;
}

export interface SeriesPoint {
  label: string;
  [key: string]: string | number;
}

export interface CurrentUser {
  id: string;
  name: string;
  roleKey: string;
  specialtyKey: string;
  council: string;
  email: string;
  locale: Locale;
  orgName: string;
  planName: string;
}
