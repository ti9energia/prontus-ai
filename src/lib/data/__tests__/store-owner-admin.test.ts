import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addCustomRole,
  addTenant,
  auditImpersonation,
  getLandingBlock,
  listAudit,
  listCustomRoles,
  listLandingBlocks,
  listPlans,
  listTenants,
  publishLandingBlock,
  removeCustomRole,
  resetStore,
  setTenantStatus,
  upsertPlan,
} from '@/lib/data/store';

// Fase 4: real persistence for the owner panel (tenants/plans/roles/landing CMS)
// — every mutation here used to be React useState-only and evaporated on reload.
beforeEach(() => resetStore());
afterEach(() => resetStore());

describe('store — addTenant', () => {
  it('creates a tenant on the plan chosen, trial status, and audits it', () => {
    const before = listTenants().length;
    const plan = listPlans()[0];
    const tenant = addTenant({ name: '  Clínica Nova  ', planId: plan.id });

    expect(tenant.name).toBe('Clínica Nova');
    expect(tenant.planId).toBe(plan.id);
    expect(tenant.status).toBe('trial');
    expect(tenant.mrr).toBe(plan.price);
    expect(listTenants().length).toBe(before + 1);
    // it's live in the store, not just the return value
    expect(listTenants().some((t) => t.id === tenant.id)).toBe(true);
    expect(listAudit()[0]).toMatchObject({ action: 'tenant.create', result: 'ok' });
  });

  it('falls back to the first plan when planId does not match any plan', () => {
    const tenant = addTenant({ name: 'X', planId: 'plan-that-does-not-exist' });
    expect(tenant.planId).toBe(listPlans()[0].id);
  });
});

describe('store — setTenantStatus (owner suspend/reactivate)', () => {
  it('suspends and reactivates a tenant, auditing each transition', () => {
    const tenant = listTenants()[0];
    setTenantStatus(tenant.id, 'suspended');
    expect(listTenants().find((t) => t.id === tenant.id)?.status).toBe('suspended');
    expect(listAudit()[0]).toMatchObject({ action: 'tenant.suspended', result: 'ok' });

    setTenantStatus(tenant.id, 'active');
    expect(listTenants().find((t) => t.id === tenant.id)?.status).toBe('active');
    expect(listAudit()[0]).toMatchObject({ action: 'tenant.active', result: 'ok' });
  });
});

describe('store — auditImpersonation', () => {
  it('pushes a tenant.impersonate audit row naming the tenant', () => {
    const before = listAudit().length;
    auditImpersonation('ten_0001', 'Clínica Aurora');
    const rows = listAudit();
    expect(rows.length).toBe(before + 1);
    expect(rows[0]).toMatchObject({ action: 'tenant.impersonate', result: 'ok' });
    expect(rows[0].target).toContain('ten_0001');
    expect(rows[0].target).toContain('Clínica Aurora');
  });
});

describe('store — upsertPlan', () => {
  it('creates a new plan when the id is unknown', () => {
    const before = listPlans().length;
    const created = upsertPlan({
      id: 'plan_custom',
      name: 'Custom',
      price: 599,
      currency: 'BRL',
      modules: ['encounters'],
      quotas: { doctors: 10, minutes: 3000, whatsapp: true },
      featureKeys: [],
    });
    expect(created.id).toBe('plan_custom');
    expect(listPlans().length).toBe(before + 1);
    expect(listAudit()[0]).toMatchObject({ action: 'plan.create', result: 'ok' });
  });

  it('updates an existing plan in place (no duplicate) when the id matches', () => {
    const existing = listPlans()[0];
    const before = listPlans().length;
    upsertPlan({ ...existing, price: existing.price + 100 });

    expect(listPlans().length).toBe(before);
    expect(listPlans().find((p) => p.id === existing.id)?.price).toBe(existing.price + 100);
    expect(listAudit()[0]).toMatchObject({ action: 'plan.update', result: 'ok' });
  });

  it('trims a blank name back to the plan id rather than persisting empty text', () => {
    const p = upsertPlan({
      id: 'plan_blank',
      name: '   ',
      price: 10,
      currency: 'BRL',
      modules: [],
      quotas: { doctors: 1, minutes: 1, whatsapp: false },
      featureKeys: [],
    });
    expect(p.name).toBe('plan_blank');
  });
});

describe('store — custom roles (owner RBAC)', () => {
  it('starts empty, adds, lists, and removes a custom role', () => {
    expect(listCustomRoles()).toEqual([]);

    const role = addCustomRole({ label: 'Auditor', allowed: ['view', 'act'] });
    expect(role.label).toBe('Auditor');
    expect(role.allowed).toEqual(['view', 'act']);
    expect(listCustomRoles()).toHaveLength(1);
    expect(listAudit()[0]).toMatchObject({ action: 'role.create', result: 'ok' });

    removeCustomRole(role.key);
    expect(listCustomRoles()).toEqual([]);
    expect(listAudit()[0]).toMatchObject({ action: 'role.remove', result: 'ok' });
  });

  it('generates distinct keys for roles added in sequence', () => {
    const a = addCustomRole({ label: 'A', allowed: [] });
    const b = addCustomRole({ label: 'B', allowed: [] });
    expect(a.key).not.toBe(b.key);
    expect(listCustomRoles().map((r) => r.key)).toEqual([a.key, b.key]);
  });
});

describe('store — landing CMS blocks', () => {
  it('has no blocks until the owner publishes one', () => {
    expect(listLandingBlocks()).toEqual([]);
    expect(getLandingBlock('hero', 'pt-BR')).toBeUndefined();
  });

  it('publishLandingBlock upserts by section+locale and marks it published', () => {
    const block = publishLandingBlock('hero', 'pt-BR', {
      title: 'Da fala à guia TISS',
      subtitle: 'Escriba clínico de IA',
      cta: 'Começar agora',
    });
    expect(block.published).toBe(true);
    expect(getLandingBlock('hero', 'pt-BR')).toMatchObject({ title: 'Da fala à guia TISS' });
    expect(listAudit()[0]).toMatchObject({ action: 'landing.publish', result: 'ok' });

    // republishing the same section+locale updates in place, no duplicate
    publishLandingBlock('hero', 'pt-BR', { title: 'Novo título', subtitle: '', cta: '' });
    expect(listLandingBlocks().filter((b) => b.section === 'hero' && b.locale === 'pt-BR')).toHaveLength(1);
    expect(getLandingBlock('hero', 'pt-BR')?.title).toBe('Novo título');
  });

  it('keeps each locale of a section independent', () => {
    publishLandingBlock('hero', 'pt-BR', { title: 'PT', subtitle: '', cta: '' });
    publishLandingBlock('hero', 'en', { title: 'EN', subtitle: '', cta: '' });
    expect(getLandingBlock('hero', 'pt-BR')?.title).toBe('PT');
    expect(getLandingBlock('hero', 'en')?.title).toBe('EN');
    expect(listLandingBlocks()).toHaveLength(2);
  });
});
