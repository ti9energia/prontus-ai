import type { RoleKey } from '@/lib/types';

/**
 * Single source of truth for authorization (spec 0C §4.3) — the SAME matrix is
 * read by the UI (entitlements/screen gating), the API routes, and Mari's tools,
 * so a role grants the same thing everywhere. Pure + isomorphic: no store/node
 * imports, safe in edge middleware and Node handlers alike.
 */
export type Permission =
  | 'clinical.view'
  | 'clinical.act'
  | 'tiss.create'
  | 'tiss.submit'
  | 'billing.view'
  | 'billing.act'
  | 'requisition.create'
  | 'requisition.review'
  | 'requisition.approve'
  | 'patients.view'
  | 'templates.edit'
  | 'team.manage'
  | 'org.configure'
  | 'ai.configure'
  | 'platform.tenants'
  | 'platform.plans'
  | 'platform.flags'
  | 'platform.all';

const MEDICO: Permission[] = [
  'clinical.view',
  'clinical.act',
  'tiss.create',
  'tiss.submit',
  'requisition.create',
  'patients.view',
  'templates.edit',
  'billing.view',
];
const FATURISTA: Permission[] = [
  'billing.view',
  'billing.act',
  'tiss.submit',
  'requisition.review',
  'requisition.approve',
  'patients.view',
];
const GESTOR: Permission[] = [
  'clinical.view',
  'billing.view',
  'requisition.approve',
  'patients.view',
  'org.configure',
  'ai.configure',
];
const MANAGER: Permission[] = [
  ...MEDICO,
  'requisition.review',
  'requisition.approve',
  'team.manage',
];
const VIEWER: Permission[] = ['clinical.view', 'billing.view', 'patients.view'];

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  owner: ['platform.all'],
  staff: ['platform.tenants', 'platform.flags', 'clinical.view', 'billing.view', 'patients.view'],
  support: ['clinical.view', 'billing.view', 'patients.view'],
  org_admin: [
    ...new Set<Permission>([...MANAGER, ...FATURISTA, 'org.configure', 'ai.configure', 'team.manage']),
  ],
  manager: MANAGER,
  medico: MEDICO,
  faturista: FATURISTA,
  gestor: GESTOR,
  viewer: VIEWER,
};

/** Does `role` hold `perm`? Owner's `platform.all` is the master key. */
export function can(role: RoleKey, perm: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('platform.all') || perms.includes(perm);
}

export function permsFor(role: RoleKey): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
