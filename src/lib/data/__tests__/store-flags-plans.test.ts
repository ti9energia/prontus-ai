import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ALL_MODULE_KEYS,
  addPatient,
  getCurrentUser,
  listFlags,
  listPatients,
  listPlans,
  resetStore,
  toggleFlag,
} from '@/lib/data/store';

// These cases mutate flags / the current user / the patient list, so isolate
// every test behind a fresh seed.
beforeEach(() => resetStore());
afterEach(() => resetStore());

describe('store — feature flags', () => {
  it('seeds one flag per module in ALL_MODULE_KEYS', () => {
    const modules = listFlags().map((f) => f.module).sort();
    expect(modules).toEqual([...ALL_MODULE_KEYS].sort());
    // no module appears twice
    expect(new Set(modules).size).toBe(ALL_MODULE_KEYS.length);
  });

  it('seeds every flag enabled with a coherent scope and rollout', () => {
    for (const f of listFlags()) {
      expect(f.enabled).toBe(true);
      expect(['global', 'plan', 'tenant']).toContain(f.scope);
      expect(f.rollout).toBeGreaterThanOrEqual(0);
      expect(f.rollout).toBeLessThanOrEqual(100);
    }
  });

  it('toggleFlag flips the flag and returns the updated record', () => {
    const before = listFlags().find((f) => f.module === 'tiss')!;
    expect(before.enabled).toBe(true);

    const off = toggleFlag('tiss');
    expect(off?.module).toBe('tiss');
    expect(off?.enabled).toBe(false);
    // the change is reflected in the live store, not just the return value
    expect(listFlags().find((f) => f.module === 'tiss')?.enabled).toBe(false);

    const on = toggleFlag('tiss');
    expect(on?.enabled).toBe(true);
  });

  it('toggleFlag returns undefined for an unknown module', () => {
    expect(toggleFlag('module-that-does-not-exist')).toBeUndefined();
  });
});

describe('store — plans & current user', () => {
  it('resolves the seed user plan to a real plan with non-empty modules', () => {
    const user = getCurrentUser();
    const plan = listPlans().find(
      (p) => p.name.toLowerCase() === user.planName.toLowerCase(),
    );
    expect(plan).toBeTruthy();
    expect(plan!.modules.length).toBeGreaterThan(0);
  });

  it('exposes coherently shaped plans, cheapest first', () => {
    const plans = listPlans();
    expect(plans.length).toBeGreaterThan(0);
    for (const p of plans) {
      expect(p.modules.length).toBeGreaterThan(0);
      expect(p.price).toBeGreaterThan(0);
      expect(typeof p.currency).toBe('string');
    }
    // prices ascend with tier
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].price).toBeGreaterThan(plans[i - 1].price);
    }
  });

  it('grants every module on the top (Scale) plan', () => {
    const scale = listPlans().find((p) => p.name === 'Scale')!;
    expect(new Set(scale.modules)).toEqual(new Set(ALL_MODULE_KEYS));
  });
});

describe('store — resetStore', () => {
  it('restores patients, flags, and the current user back to seed', () => {
    const seedPatients = listPatients().length;

    addPatient({ name: 'Temporário', payer: 'Amil' });
    toggleFlag('tiss');
    getCurrentUser().planName = 'Starter';

    expect(listPatients().length).toBe(seedPatients + 1);
    expect(listFlags().find((f) => f.module === 'tiss')?.enabled).toBe(false);
    expect(getCurrentUser().planName).toBe('Starter');

    resetStore();

    expect(listPatients().length).toBe(seedPatients);
    expect(listFlags().find((f) => f.module === 'tiss')?.enabled).toBe(true);
    expect(getCurrentUser().planName).toBe('Scale');
  });
});
