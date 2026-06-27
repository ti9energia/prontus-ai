'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  Banknote,
  Bot,
  CalendarClock,
  CalendarDays,
  Cable,
  ClipboardCheck,
  FileCheck,
  FileText,
  FileSignature,
  Handshake,
  LayoutTemplate,
  MessageCircle,
  Mic,
  PenTool,
  ReceiptText,
  Settings as SettingsIcon,
  Sparkles,
  Store,
  Users,
  UserCog,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { ScreenKey } from '@/lib/workspace/store';
import { ScreenSkeleton } from '@/components/screens/_kit';

export type ScreenGroup = 'product' | 'clinic' | 'system';

export interface ScreenDef {
  key: ScreenKey;
  icon: LucideIcon;
  group: ScreenGroup;
  /** Full dotted i18n key for the tab/rail title (resolved with a root translator). */
  titleKey?: string;
  /** Or an inline per-locale label when no catalog key fits. */
  titleMap?: Record<string, string>;
  Component: React.ComponentType<{ paneId: string; params?: Record<string, string> }>;
}

type Loader = () => Promise<{ default: React.ComponentType<any> }>;
const lazy = (loader: Loader) =>
  dynamic(loader, { loading: () => <ScreenSkeleton />, ssr: false });

export const SCREENS: Record<ScreenKey, ScreenDef> = {
  today: {
    key: 'today',
    icon: CalendarDays,
    group: 'product',
    titleKey: 'nav.today',
    Component: lazy(() => import('@/components/screens/today').then((m) => ({ default: m.TodayScreen }))),
  },
  agenda: {
    key: 'agenda',
    icon: CalendarClock,
    group: 'product',
    titleMap: { 'pt-BR': 'Agenda', en: 'Schedule', 'zh-CN': '日程', 'fr-FR': 'Agenda' },
    Component: lazy(() => import('@/components/screens/agenda').then((m) => ({ default: m.AgendaScreen }))),
  },
  encounter: {
    key: 'encounter',
    icon: Mic,
    group: 'product',
    titleKey: 'nav.encounter',
    Component: lazy(() => import('@/components/screens/encounter').then((m) => ({ default: m.EncounterScreen }))),
  },
  review: {
    key: 'review',
    icon: ClipboardCheck,
    group: 'product',
    titleKey: 'nav.review',
    Component: lazy(() => import('@/components/screens/review').then((m) => ({ default: m.ReviewScreen }))),
  },
  tiss: {
    key: 'tiss',
    icon: FileCheck,
    group: 'product',
    titleKey: 'nav.tiss',
    Component: lazy(() => import('@/components/screens/tiss').then((m) => ({ default: m.TissScreen }))),
  },
  patients: {
    key: 'patients',
    icon: Users,
    group: 'clinic',
    titleKey: 'nav.patients',
    Component: lazy(() => import('@/components/screens/patients').then((m) => ({ default: m.PatientsScreen }))),
  },
  billing: {
    key: 'billing',
    icon: ReceiptText,
    group: 'clinic',
    titleKey: 'nav.billing',
    Component: lazy(() => import('@/components/screens/billing').then((m) => ({ default: m.BillingScreen }))),
  },
  reports: {
    key: 'reports',
    icon: BarChart3,
    group: 'clinic',
    titleMap: { 'pt-BR': 'Relatórios', en: 'Reports', 'zh-CN': '报告', 'fr-FR': 'Rapports' },
    Component: lazy(() => import('@/components/screens/reports').then((m) => ({ default: m.ReportsScreen }))),
  },
  templates: {
    key: 'templates',
    icon: LayoutTemplate,
    group: 'clinic',
    titleKey: 'nav.templates',
    Component: lazy(() => import('@/components/screens/templates').then((m) => ({ default: m.TemplatesScreen }))),
  },
  documents: {
    key: 'documents',
    icon: FileText,
    group: 'clinic',
    titleMap: { 'pt-BR': 'Documentos', en: 'Documents', 'zh-CN': '文档', 'fr-FR': 'Documents' },
    Component: lazy(() => import('@/components/screens/documents').then((m) => ({ default: m.DocumentsScreen }))),
  },
  signature: {
    key: 'signature',
    icon: PenTool,
    group: 'system',
    titleMap: { 'pt-BR': 'Assinatura', en: 'Signature', 'zh-CN': '数字签名', 'fr-FR': 'Signature' },
    Component: lazy(() => import('@/components/screens/signature').then((m) => ({ default: m.SignatureScreen }))),
  },
  agent: {
    key: 'agent',
    icon: Sparkles,
    group: 'system',
    titleMap: { 'pt-BR': 'Agente', en: 'Agent', 'zh-CN': '智能体', 'fr-FR': 'Agent' },
    Component: lazy(() => import('@/components/screens/agent').then((m) => ({ default: m.AgentScreen }))),
  },
  agents: {
    key: 'agents',
    icon: Bot,
    group: 'system',
    titleMap: { 'pt-BR': 'Agentes IA', en: 'AI Agents', 'zh-CN': 'AI 智能体', 'fr-FR': 'Agents IA' },
    Component: lazy(() => import('@/components/screens/agents').then((m) => ({ default: m.AgentsScreen }))),
  },
  whatsapp: {
    key: 'whatsapp',
    icon: MessageCircle,
    group: 'system',
    titleMap: { 'pt-BR': 'WhatsApp', en: 'WhatsApp', 'zh-CN': 'WhatsApp', 'fr-FR': 'WhatsApp' },
    Component: lazy(() => import('@/components/screens/whatsapp').then((m) => ({ default: m.WhatsappScreen }))),
  },
  automations: {
    key: 'automations',
    icon: Workflow,
    group: 'system',
    titleMap: { 'pt-BR': 'Automações', en: 'Automations', 'zh-CN': '自动化', 'fr-FR': 'Automatisations' },
    Component: lazy(() => import('@/components/screens/automations').then((m) => ({ default: m.AutomationsScreen }))),
  },
  integrations: {
    key: 'integrations',
    icon: Cable,
    group: 'system',
    titleKey: 'nav.integrations',
    Component: lazy(() => import('@/components/screens/integrations').then((m) => ({ default: m.IntegrationsScreen }))),
  },
  marketplace: {
    key: 'marketplace',
    icon: Store,
    group: 'system',
    titleMap: { 'pt-BR': 'Marketplace', en: 'Marketplace', 'zh-CN': '应用市场', 'fr-FR': 'Marketplace' },
    Component: lazy(() => import('@/components/screens/marketplace').then((m) => ({ default: m.MarketplaceScreen }))),
  },
  requisicao: {
    key: 'requisicao',
    icon: FileSignature,
    group: 'clinic',
    titleMap: { 'pt-BR': 'Requisição', en: 'Requisition', 'zh-CN': '申请', 'fr-FR': 'Requête' },
    Component: lazy(() => import('@/components/screens/requisicao').then((m) => ({ default: m.RequisicaoScreen }))),
  },
  faturamento: {
    key: 'faturamento',
    icon: Banknote,
    group: 'clinic',
    titleMap: { 'pt-BR': 'Faturamento', en: 'Billing team', 'zh-CN': '收费', 'fr-FR': 'Facturation' },
    Component: lazy(() => import('@/components/screens/faturamento').then((m) => ({ default: m.FaturamentoScreen }))),
  },
  equipe: {
    key: 'equipe',
    icon: UserCog,
    group: 'system',
    titleMap: { 'pt-BR': 'Equipe', en: 'Team', 'zh-CN': '团队', 'fr-FR': 'Équipe' },
    Component: lazy(() => import('@/components/screens/equipe').then((m) => ({ default: m.EquipeScreen }))),
  },
  contratos: {
    key: 'contratos',
    icon: Handshake,
    group: 'system',
    titleMap: { 'pt-BR': 'Contratos', en: 'Contracts', 'zh-CN': '合同', 'fr-FR': 'Contrats' },
    Component: lazy(() => import('@/components/screens/contratos').then((m) => ({ default: m.ContratosScreen }))),
  },
  settings: {
    key: 'settings',
    icon: SettingsIcon,
    group: 'system',
    titleKey: 'nav.settings',
    Component: lazy(() => import('@/components/screens/settings').then((m) => ({ default: m.SettingsScreen }))),
  },
};

export const SCREEN_ORDER: ScreenKey[] = [
  'today',
  'agenda',
  'encounter',
  'review',
  'tiss',
  'requisicao',
  'patients',
  'billing',
  'faturamento',
  'reports',
  'templates',
  'documents',
  'signature',
  'agent',
  'agents',
  'whatsapp',
  'automations',
  'integrations',
  'marketplace',
  'equipe',
  'contratos',
  'settings',
];

/** Hook helper: resolve a screen's display title. */
export function useScreenTitle() {
  return React.useCallback(
    (def: ScreenDef, locale: string, t: (k: string) => string) =>
      def.titleMap?.[locale] ?? (def.titleKey ? t(def.titleKey) : def.key),
    [],
  );
}
