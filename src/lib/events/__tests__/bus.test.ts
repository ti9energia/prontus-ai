import { describe, it, expect, vi } from 'vitest';
import { bus } from '@/lib/events/bus';

/** Block 7 — the inter-module event bus (0D §5). */
describe('event bus', () => {
  it('delivers events to subscribers and supports unsubscribe', () => {
    const fn = vi.fn();
    const off = bus.on('note.approved', fn);
    bus.emit('note.approved', { encounterId: 'enc_1' });
    expect(fn).toHaveBeenCalledWith({ encounterId: 'enc_1' });
    off();
    bus.emit('note.approved', { encounterId: 'enc_2' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('isolates a subscriber error from the publisher and siblings', () => {
    const good = vi.fn();
    bus.on('guide.submitted', () => {
      throw new Error('boom');
    });
    bus.on('guide.submitted', good);
    expect(() => bus.emit('guide.submitted', { guideId: 'g1' })).not.toThrow();
    expect(good).toHaveBeenCalled();
  });
});
