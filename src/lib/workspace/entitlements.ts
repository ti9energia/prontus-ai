import type { ScreenKey } from './store';
import type { RoleKey } from '@/lib/types';
import { getCurrentUser, listFlags, listPlans } from '@/lib/data/store';
import { can, type Permission } from '@/lib/auth/permissions';

/**
 * Runtime access resolution for workspace screens — the live wiring behind the
 * owner panel's feature flags and plan entitlements (specs 0C §4/§6, 0D §3).
 *
 *   access = (feature flag ON) AND (plan grants the module)
 *
 * A disabled feature flag removes the tab from every surface together (rail +
 * command palette); a module the plan doesn't include shows as locked → upsell.
 * Screens with no module mapping are core capabilities and are always available.
 */
const SCREEN_MODULE: Partial<Record<ScreenKey, string>> = {
  encounter: 'encounters',
  review: 'clinical-notes',
  tiss: 'tiss',
  patients: 'patients',
  billing: 'billing',
  templates: 'templates',
  integrations: 'integrations',
  agent: 'agent',
  agents: 'agent',
  whatsapp: 'whatsapp',
};

/** Permission a role must hold to even see a screen (0C §4.3). Screens not listed
 *  here are permission-free (any signed-in user). */
const SCREEN_PERMISSION: Partial<Record<ScreenKey, Permission>> = {
  encounter: 'clinical.act',
  review: 'clinical.act',
  tiss: 'tiss.create',
  billing: 'billing.view',
  patients: 'patients.view',
  templates: 'templates.edit',
  requisicao: 'requisition.create',
  faturamento: 'billing.view',
};

export type ScreenStatus = 'open' | 'locked' | 'hidden';

export function moduleForScreen(key: ScreenKey): string | undefined {
  return SCREEN_MODULE[key];
}

/** Modules granted by the signed-in user's plan, or null when the plan is unknown
 *  (in which case nothing is plan-locked). */
function currentPlanModules(): string[] | null {
  const planName = (getCurrentUser().planName ?? '').toLowerCase();
  const plan = listPlans().find((p) => p.name.toLowerCase() === planName);
  return plan?.modules ?? null;
}

/** Resolve a screen's availability from the feature flags (global kill-switch)
 *  and the current plan's entitlements. */
export function screenStatus(key: ScreenKey, role?: RoleKey): ScreenStatus {
  // Role gate first: a role that can't perform the screen's action never sees it.
  const perm = SCREEN_PERMISSION[key];
  if (role && perm && !can(role, perm)) return 'hidden';

  const module = SCREEN_MODULE[key];
  if (!module) return 'open'; // core screen — always on

  // Feature flag OFF → the tab disappears from UI + commands together (0D §3).
  const flag = listFlags().find((f) => f.module === module);
  if (flag && !flag.enabled) return 'hidden';

  // Plan entitlement: a module the plan doesn't include is locked → upsell (0C §4.4).
  const modules = currentPlanModules();
  if (modules && !modules.includes(module)) return 'locked';

  return 'open';
}

export function isScreenVisible(key: ScreenKey, role?: RoleKey): boolean {
  return screenStatus(key, role) !== 'hidden';
}

/** Lowest plan name that first unlocks a module — used to phrase the upsell. */
export function unlockPlanFor(key: ScreenKey): string | undefined {
  const module = SCREEN_MODULE[key];
  if (!module) return undefined;
  const plan = listPlans().find((p) => p.modules.includes(module));
  return plan?.name;
}
