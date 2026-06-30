type Handler<T> = (payload: T) => void;

/**
 * Minimal typed event bus (spec 0D §5). Modules communicate by publishing/subscribing
 * instead of importing each other — the seam for decoupling and for the AI Core to react
 * to platform events (update RAG, send a WhatsApp push, etc.) without coupling.
 */
export interface PlatformEvents {
  'guide.created': { guideId: string; encounterId: string };
  'guide.submitted': { guideId: string };
  'requisition.decided': { guideId: string; decision: 'authorized' | 'denied' };
  'note.approved': { encounterId: string };
  'tenant.config.updated': { tenantId: string };
  'whatsapp.inbound': { from: string; body: string; messageId: string; timestamp: number };
}

class EventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof PlatformEvents>(type: K, handler: Handler<PlatformEvents[K]>): () => void {
    const set = this.handlers.get(type) ?? new Set<Handler<unknown>>();
    set.add(handler as Handler<unknown>);
    this.handlers.set(type, set);
    return () => set.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof PlatformEvents>(type: K, payload: PlatformEvents[K]): void {
    this.handlers.get(type)?.forEach((h) => {
      try {
        (h as Handler<PlatformEvents[K]>)(payload);
      } catch {
        /* a subscriber error must never break the publisher or sibling subscribers */
      }
    });
  }
}

export const bus = new EventBus();
