import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  completeOnboardingStep,
  createOrder,
  getOnboardingProgress,
  getOrder,
  getUserByEmail,
  isWebhookEventProcessed,
  listOrdersForOrg,
  listPlans,
  listTenants,
  markOrderStatus,
  markWebhookEventProcessed,
  registerTenant,
  resetStore,
} from '@/lib/data/store';

beforeEach(() => resetStore());
afterEach(() => resetStore());

describe('store — registerTenant (self-service signup)', () => {
  it('creates a real trial tenant ($0 MRR) and an org_admin user with the given password hash', () => {
    const before = listTenants().length;
    const { tenant, user } = registerTenant({
      orgName: 'Clínica Nova Era',
      name: 'Dr. João Pereira',
      email: '  Joao@NovaEra.com.br  ',
      passwordHash: 'scrypt$deadbeef$cafebabe',
      specialtyKey: 'cardio',
    });

    expect(tenant.status).toBe('trial');
    expect(tenant.mrr).toBe(0);
    expect(listTenants().length).toBe(before + 1);

    expect(user.orgId).toBe(tenant.id);
    expect(user.roleKey).toBe('org_admin');
    expect(user.email).toBe('joao@novaera.com.br'); // trimmed + lowercased
    expect(user.passwordHash).toBe('scrypt$deadbeef$cafebabe');
    expect(user.specialtyKey).toBe('cardio');
  });

  it('the new user is immediately findable by email (the login path depends on this)', () => {
    registerTenant({ orgName: 'X', name: 'Ana', email: 'ana@x.com', passwordHash: 'h' });
    expect(getUserByEmail('ana@x.com')?.name).toBe('Ana');
    expect(getUserByEmail('ANA@X.COM')?.name).toBe('Ana'); // case-insensitive lookup
  });

  it('defaults to the cheapest plan for entitlement preview, without granting paid access', () => {
    const cheapest = [...listPlans()].sort((a, b) => a.price - b.price)[0];
    const { tenant } = registerTenant({ orgName: 'X', name: 'Ana', email: 'ana2@x.com', passwordHash: 'h' });
    expect(tenant.planId).toBe(cheapest.id);
  });
});

describe('store — onboarding progress', () => {
  it('starts on the first step with nothing completed', () => {
    const p = getOnboardingProgress('ten_test');
    expect(p.currentStep).toBe('profile');
    expect(p.completedSteps).toEqual([]);
  });

  it('is idempotent — fetching twice returns the same record, not a fresh one', () => {
    const a = getOnboardingProgress('ten_test');
    completeOnboardingStep('ten_test', 'profile', 'Dr. Ana', { clinicSize: '2-5' });
    const b = getOnboardingProgress('ten_test');
    expect(b).toBe(a); // same object reference — mutated in place, not recreated
    expect(b.completedSteps).toEqual(['profile']);
    expect(b.data.clinicSize).toBe('2-5');
  });

  it('advances currentStep in order and lands on null (and audits) after the last step', () => {
    const actor = 'Dr. Ana';
    expect(completeOnboardingStep('ten_test', 'profile', actor).currentStep).toBe('specialty');
    expect(completeOnboardingStep('ten_test', 'specialty', actor, { specialtyKey: 'clinica' }).currentStep).toBe('team');
    expect(completeOnboardingStep('ten_test', 'team', actor, { invitedEmails: ['a@b.com'] }).currentStep).toBe('tour');
    const final = completeOnboardingStep('ten_test', 'tour', actor);
    expect(final.currentStep).toBeNull();
    expect(final.completedSteps).toEqual(['profile', 'specialty', 'team', 'tour']);
    expect(final.data).toEqual({ specialtyKey: 'clinica', invitedEmails: ['a@b.com'] });
  });

  it('completing an already-completed step is a no-op on the list (no duplicates)', () => {
    completeOnboardingStep('ten_test', 'profile', 'x');
    const again = completeOnboardingStep('ten_test', 'profile', 'x');
    expect(again.completedSteps).toEqual(['profile']);
  });

  it('keeps separate progress per org', () => {
    completeOnboardingStep('ten_a', 'profile', 'x');
    expect(getOnboardingProgress('ten_a').completedSteps).toEqual(['profile']);
    expect(getOnboardingProgress('ten_b').completedSteps).toEqual([]);
  });
});

describe('store — orders / checkout lifecycle', () => {
  it('createOrder starts pending and is retrievable by id and by org', () => {
    const plan = listPlans()[0];
    const order = createOrder({
      orgId: 'ten_0001',
      planId: plan.id,
      amountCents: plan.price * 100,
      cycle: 'monthly',
      method: 'pix',
      provider: 'mock',
    });
    expect(order.status).toBe('pending');
    expect(getOrder(order.id)?.id).toBe(order.id);
    expect(listOrdersForOrg('ten_0001').map((o) => o.id)).toContain(order.id);
  });

  it('markOrderStatus("paid") activates the tenant: leaves trial, adopts the plan, sets MRR', () => {
    const { tenant } = registerTenant({ orgName: 'Trial Co', name: 'Ana', email: 'trial@co.com', passwordHash: 'h' });
    expect(tenant.status).toBe('trial');
    const plan = listPlans().find((p) => p.price === Math.max(...listPlans().map((p) => p.price)))!; // priciest, to be sure it actually switched

    const order = createOrder({
      orgId: tenant.id,
      planId: plan.id,
      amountCents: plan.price * 100,
      cycle: 'monthly',
      method: 'pix',
      provider: 'mock',
    });
    const updated = markOrderStatus(order.id, 'paid', 'mock_ref_1');

    expect(updated?.status).toBe('paid');
    expect(updated?.paidAt).toBeTruthy();
    expect(updated?.providerRef).toBe('mock_ref_1');

    const refreshedTenant = listTenants().find((t) => t.id === tenant.id)!;
    expect(refreshedTenant.status).toBe('active');
    expect(refreshedTenant.planId).toBe(plan.id);
    expect(refreshedTenant.mrr).toBe(plan.price);
  });

  it('yearly MRR uses the same "2 months free" formula as the landing pricing table', () => {
    const plan = listPlans()[0];
    const { tenant } = registerTenant({ orgName: 'Y', name: 'Ana', email: 'yearly@co.com', passwordHash: 'h' });
    const order = createOrder({
      orgId: tenant.id,
      planId: plan.id,
      amountCents: Math.round((plan.price * 10) / 12) * 12 * 100,
      cycle: 'yearly',
      method: 'boleto',
      provider: 'mock',
    });
    markOrderStatus(order.id, 'paid');
    const refreshed = listTenants().find((t) => t.id === tenant.id)!;
    expect(refreshed.mrr).toBe(Math.round((plan.price * 10) / 12));
  });

  it('markOrderStatus is a no-op (returns undefined) for an unknown order id', () => {
    expect(markOrderStatus('ord_does_not_exist', 'paid')).toBeUndefined();
  });

  it('a "failed" order does not touch the tenant at all', () => {
    const { tenant } = registerTenant({ orgName: 'Z', name: 'Ana', email: 'fail@co.com', passwordHash: 'h' });
    const plan = listPlans()[0];
    const order = createOrder({
      orgId: tenant.id,
      planId: plan.id,
      amountCents: plan.price * 100,
      cycle: 'monthly',
      method: 'card',
      provider: 'mock',
    });
    markOrderStatus(order.id, 'failed');
    const refreshed = listTenants().find((t) => t.id === tenant.id)!;
    expect(refreshed.status).toBe('trial');
    expect(refreshed.mrr).toBe(0);
  });
});

describe('store — webhook idempotency', () => {
  it('an event id is unprocessed until explicitly marked', () => {
    expect(isWebhookEventProcessed('evt_1')).toBe(false);
    markWebhookEventProcessed('evt_1');
    expect(isWebhookEventProcessed('evt_1')).toBe(true);
  });

  it('marking the same event id twice does not duplicate it', () => {
    markWebhookEventProcessed('evt_dup');
    markWebhookEventProcessed('evt_dup');
    expect(isWebhookEventProcessed('evt_dup')).toBe(true);
  });
});
