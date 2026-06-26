import { describe, it, expect } from 'vitest';
import { can, permsFor, ROLE_PERMISSIONS } from '@/lib/auth/permissions';

/** Block 3 — the single RBAC matrix read by UI, API, and Mari tools. */
describe('RBAC permission matrix', () => {
  it('owner can do everything via platform.all', () => {
    expect(can('owner', 'clinical.act')).toBe(true);
    expect(can('owner', 'platform.plans')).toBe(true);
    expect(can('owner', 'team.manage')).toBe(true);
  });

  it('medico has clinical + tiss + billing.view, but not billing.act or team.manage', () => {
    expect(can('medico', 'clinical.act')).toBe(true);
    expect(can('medico', 'tiss.create')).toBe(true);
    expect(can('medico', 'billing.view')).toBe(true);
    expect(can('medico', 'billing.act')).toBe(false);
    expect(can('medico', 'team.manage')).toBe(false);
  });

  it('faturista handles billing + requisition review/approve, not clinical acts', () => {
    expect(can('faturista', 'billing.act')).toBe(true);
    expect(can('faturista', 'requisition.approve')).toBe(true);
    expect(can('faturista', 'clinical.act')).toBe(false);
  });

  it('viewer is read-only', () => {
    expect(can('viewer', 'clinical.view')).toBe(true);
    expect(can('viewer', 'clinical.act')).toBe(false);
    expect(can('viewer', 'billing.act')).toBe(false);
  });

  it('org_admin manages the team and configures org/AI, and can act clinically', () => {
    expect(can('org_admin', 'team.manage')).toBe(true);
    expect(can('org_admin', 'org.configure')).toBe(true);
    expect(can('org_admin', 'ai.configure')).toBe(true);
    expect(can('org_admin', 'clinical.act')).toBe(true);
  });

  it('every role key has a permission list', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>) {
      expect(permsFor(role).length).toBeGreaterThan(0);
    }
  });
});
