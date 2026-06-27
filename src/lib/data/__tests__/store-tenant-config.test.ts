import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStore,
  getTenant,
  listTenants,
  updateTenantAi,
  updateTenantWhatsapp,
  upsertTenantConnector,
} from '@/lib/data/store';
import { connectorRegistry, listConnectors } from '@/lib/connectors/registry';

/** Block 4 — owner configures each tenant's Mari/WhatsApp/connectors on their behalf. */
describe('per-tenant config', () => {
  beforeEach(() => resetStore());

  it('persists per-tenant AI config (defaults filled)', () => {
    const id = listTenants()[0].id;
    updateTenantAi(id, { persona: 'Aura', autonomy: 'scheduled', monthlyBudget: 9000 });
    const ai = getTenant(id)!.ai!;
    expect(ai.persona).toBe('Aura');
    expect(ai.autonomy).toBe('scheduled');
    expect(ai.monthlyBudget).toBe(9000);
    expect(ai.model).toBe('claude-opus-4-8');
  });

  it('persists per-tenant WhatsApp config', () => {
    const id = listTenants()[0].id;
    updateTenantWhatsapp(id, { number: '+55 11 99999-0000', commands: ['0', '2'] });
    const wa = getTenant(id)!.whatsapp!;
    expect(wa.number).toBe('+55 11 99999-0000');
    expect(wa.commands).toEqual(['0', '2']);
    expect(wa.perTenant).toBe(true);
  });

  it('upserts tenant connectors without duplicating', () => {
    const id = listTenants()[0].id;
    upsertTenantConnector(id, { id: 'whatsapp-cloud', category: 'messaging', status: 'connected', configured: true, config: {} });
    expect(getTenant(id)!.connectors!.find((c) => c.id === 'whatsapp-cloud')?.configured).toBe(true);
    upsertTenantConnector(id, { id: 'whatsapp-cloud', category: 'messaging', status: 'disconnected', configured: false, config: {} });
    const conns = getTenant(id)!.connectors!;
    expect(conns.filter((c) => c.id === 'whatsapp-cloud').length).toBe(1);
    expect(conns.find((c) => c.id === 'whatsapp-cloud')?.configured).toBe(false);
  });

  it('connector registry lists by category', () => {
    expect(listConnectors().length).toBeGreaterThan(0);
    expect(listConnectors('messaging').every((c) => c.category === 'messaging')).toBe(true);
    expect(connectorRegistry.get('telegram')?.name).toContain('Telegram');
  });
});
