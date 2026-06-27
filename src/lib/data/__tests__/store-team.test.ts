import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore, currentOrgId, listOrgUsers, addOrgUser } from '@/lib/data/store';

/** Block 5b — org team management. */
describe('team management', () => {
  beforeEach(() => resetStore());

  it('currentOrgId resolves the seed doctor org', () => {
    expect(currentOrgId()).toBe('ten_0001');
  });

  it('addOrgUser appends an invited, lowercased user to the org', () => {
    const before = listOrgUsers('ten_0001').length;
    const u = addOrgUser('ten_0001', { name: 'Novo Médico', email: 'NOVO@x.com', roleKey: 'medico' });
    expect(u.status).toBe('invited');
    expect(u.email).toBe('novo@x.com');
    expect(u.orgId).toBe('ten_0001');
    expect(listOrgUsers('ten_0001').length).toBe(before + 1);
  });
});
