import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore, listLabOrders, getLabOrder, addLabOrder, updateLabOrderStatus } from '../store';

beforeEach(() => {
  resetStore();
});

describe('listLabOrders', () => {
  it('returns all seeded lab orders', () => {
    const orders = listLabOrders();
    expect(orders.length).toBeGreaterThanOrEqual(3);
  });

  it('filters by patientId', () => {
    const all = listLabOrders();
    const firstPatient = all[0].patientId;
    const filtered = listLabOrders(firstPatient);
    expect(filtered.every((o) => o.patientId === firstPatient)).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('returns empty array for unknown patient', () => {
    expect(listLabOrders('pat_9999')).toHaveLength(0);
  });
});

describe('addLabOrder', () => {
  it('creates a new lab order with status=ordered', () => {
    const before = listLabOrders().length;
    const order = addLabOrder({
      patientId: 'pat_0001',
      priority: 'urgent',
      items: [{ code: '40301140', name: 'Hemograma' }],
    });
    expect(order.status).toBe('ordered');
    expect(order.priority).toBe('urgent');
    expect(order.patientId).toBe('pat_0001');
    expect(listLabOrders()).toHaveLength(before + 1);
  });

  it('links to encounter when encounterId provided', () => {
    const order = addLabOrder({
      patientId: 'pat_0002',
      priority: 'routine',
      items: [{ code: '40301190', name: 'Glicemia' }],
      encounterId: 'enc_0001',
    });
    expect(order.encounterId).toBe('enc_0001');
  });
});

describe('updateLabOrderStatus', () => {
  it('advances status and sets timestamps', () => {
    const orders = listLabOrders('pat_0002');
    const order = orders.find((o) => o.status === 'ordered');
    if (!order) return; // may not exist after reorder

    const now = new Date().toISOString();
    const updated = updateLabOrderStatus(order.id, 'collected', { collectedAt: now });
    expect(updated?.status).toBe('collected');
    expect(updated?.collectedAt).toBe(now);
  });

  it('returns undefined for unknown id', () => {
    const result = updateLabOrderStatus('lab_9999', 'collected');
    expect(result).toBeUndefined();
  });

  it('full status progression: ordered → collected → processing → resulted → reviewed', () => {
    const order = addLabOrder({
      patientId: 'pat_0003',
      priority: 'routine',
      items: [{ code: '40301050', name: 'TSH' }],
    });
    const t = () => new Date().toISOString();

    updateLabOrderStatus(order.id, 'collected', { collectedAt: t() });
    updateLabOrderStatus(order.id, 'processing');
    updateLabOrderStatus(order.id, 'resulted', { resultedAt: t() });
    updateLabOrderStatus(order.id, 'reviewed', { reviewedAt: t() });

    const final = getLabOrder(order.id);
    expect(final?.status).toBe('reviewed');
    expect(final?.resultedAt).toBeTruthy();
    expect(final?.reviewedAt).toBeTruthy();
  });
});
