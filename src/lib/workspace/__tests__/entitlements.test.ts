import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  screenStatus,
  isScreenVisible,
  unlockPlanFor,
  moduleForScreen,
} from '@/lib/workspace/entitlements';
import { getCurrentUser, toggleFlag, resetStore } from '@/lib/data';

// The entitlement helpers read live state from the in-memory store (feature
// flags + the signed-in user's plan), so every case starts from a clean seed.
beforeEach(() => resetStore());
afterEach(() => resetStore());

describe('entitlements — moduleForScreen', () => {
  it('maps modular screens to their module key', () => {
    expect(moduleForScreen('encounter')).toBe('encounters');
    expect(moduleForScreen('review')).toBe('clinical-notes');
    expect(moduleForScreen('tiss')).toBe('tiss');
    expect(moduleForScreen('whatsapp')).toBe('whatsapp');
  });

  it('maps both the agent and agents screens to the same module', () => {
    expect(moduleForScreen('agent')).toBe('agent');
    expect(moduleForScreen('agents')).toBe('agent');
  });

  it('returns undefined for a core screen with no module', () => {
    expect(moduleForScreen('today')).toBeUndefined();
    expect(moduleForScreen('settings')).toBeUndefined();
    expect(moduleForScreen('agenda')).toBeUndefined();
  });
});

describe('entitlements — screenStatus', () => {
  it('treats a core screen (no module) as always open', () => {
    expect(screenStatus('today')).toBe('open');
    expect(screenStatus('settings')).toBe('open');
    expect(isScreenVisible('today')).toBe(true);
  });

  it('opens a modular screen the seed (Scale) plan grants', () => {
    // The seed user is on Scale, which grants every module, flags all on.
    expect(screenStatus('tiss')).toBe('open');
    expect(screenStatus('whatsapp')).toBe('open');
    expect(isScreenVisible('tiss')).toBe(true);
  });

  it('hides a screen whose module feature flag is disabled', () => {
    expect(screenStatus('tiss')).toBe('open');

    const flag = toggleFlag('tiss'); // kill-switch OFF
    expect(flag?.enabled).toBe(false);

    expect(screenStatus('tiss')).toBe('hidden');
    expect(isScreenVisible('tiss')).toBe(false);

    toggleFlag('tiss'); // restore (afterEach also reseeds)
    expect(screenStatus('tiss')).toBe('open');
    expect(isScreenVisible('tiss')).toBe(true);
  });

  it('locks a module the current plan does not include', () => {
    // Downgrade the seed user from Scale → Starter, which lacks tiss/integrations.
    getCurrentUser().planName = 'Starter';

    expect(screenStatus('tiss')).toBe('locked');
    expect(screenStatus('integrations')).toBe('locked');
    expect(screenStatus('billing')).toBe('locked');

    // Starter still grants encounters/patients → open.
    expect(screenStatus('encounter')).toBe('open');
    expect(screenStatus('patients')).toBe('open');

    // Locked is still visible (it drives the upsell, unlike hidden).
    expect(isScreenVisible('tiss')).toBe(true);
  });

  it('lets the disabled flag win over a plan lock when both apply', () => {
    getCurrentUser().planName = 'Starter'; // Starter does not grant tiss → would lock
    toggleFlag('tiss'); // …but a killed flag hides it outright
    expect(screenStatus('tiss')).toBe('hidden');
  });

  it('treats an unknown plan as unrestricted (nothing plan-locked)', () => {
    getCurrentUser().planName = 'Nonexistent Plan';
    // currentPlanModules() is null → only the feature flag gates the screen.
    expect(screenStatus('tiss')).toBe('open');
    expect(screenStatus('integrations')).toBe('open');
  });
});

describe('entitlements — unlockPlanFor', () => {
  it('returns the cheapest plan that first unlocks the module', () => {
    expect(unlockPlanFor('encounter')).toBe('Starter'); // in the entry plan
    expect(unlockPlanFor('tiss')).toBe('Pro'); // first appears in Pro
    expect(unlockPlanFor('billing')).toBe('Pro');
    expect(unlockPlanFor('agent')).toBe('Pro');
    expect(unlockPlanFor('integrations')).toBe('Scale'); // only the top plan
    expect(unlockPlanFor('whatsapp')).toBe('Scale');
  });

  it('returns undefined for a core screen with no module', () => {
    expect(unlockPlanFor('today')).toBeUndefined();
    expect(unlockPlanFor('settings')).toBeUndefined();
  });
});
