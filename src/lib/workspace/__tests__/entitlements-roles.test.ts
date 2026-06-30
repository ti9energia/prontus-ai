import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore, listUsers, getUserByEmail, listOrgUsers } from '@/lib/data';
import { screenStatus, isScreenVisible } from '@/lib/workspace/entitlements';

/** Block 3 — seeded org/user model + role-aware screen gating. */
describe('users model + role-aware screen gating', () => {
  beforeEach(() => resetStore());

  it('seeds org users including a multi-doctor hospital (ten_0002)', () => {
    expect(listUsers().length).toBeGreaterThanOrEqual(8);
    const hospital = listOrgUsers('ten_0002');
    expect(hospital.length).toBeGreaterThanOrEqual(3);
    expect(hospital.filter((u) => u.roleKey === 'medico').length).toBeGreaterThanOrEqual(2);
    expect(getUserByEmail('helena@clinicaaurora.com.br')?.roleKey).toBe('medico');
    expect(getUserByEmail('HELENA@clinicaaurora.com.br')?.orgId).toBe('ten_0001'); // case-insensitive
  });

  it('hides clinical screens from a faturista but keeps billing + core', () => {
    expect(screenStatus('encounter', 'faturista')).toBe('hidden');
    expect(screenStatus('review', 'faturista')).toBe('hidden');
    expect(isScreenVisible('billing', 'faturista')).toBe(true);
    expect(screenStatus('today', 'faturista')).toBe('open'); // core screen, no permission needed
  });

  it('keeps clinical screens for a medico; omitting the role preserves old behavior', () => {
    expect(screenStatus('encounter', 'medico')).not.toBe('hidden');
    expect(screenStatus('encounter')).not.toBe('hidden'); // no role → no role gate (back-compat)
  });
});
