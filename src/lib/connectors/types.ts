/**
 * Connector contract — how the system talks to *external* systems (EHR/EMR,
 * payer / TISS gateways, WhatsApp & messaging, ASR/voice, billing, identity…).
 *
 * Every integration implements this one interface, so the app, Mari, and any
 * other product reach third parties through a single stable, swappable seam —
 * never against a vendor SDK directly. Concrete connectors live behind the
 * interface and are resolved at runtime from a registry.
 *
 * This file is the contract only (no vendor code), so it is safe to depend on
 * from anywhere. See docs/ARCHITECTURE.md for the full integration design.
 */

export type ConnectorCategory =
  | 'ehr'
  | 'payer'
  | 'messaging'
  | 'asr'
  | 'billing'
  | 'identity'
  | 'other';

export type ConnectorStatus = 'connected' | 'disconnected' | 'error';

export interface ConnectorContext {
  /** Tenant / org the call is scoped to — keeps every connector multi-tenant safe. */
  orgId: string;
  /** Per-connector secrets & config, injected by the host (never hard-coded). */
  config: Record<string, string>;
  locale?: string;
}

export interface ConnectorResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/**
 * A single capability a connector exposes — e.g. `ehr.patient.read`,
 * `payer.claim.submit`, `messaging.send`. Capabilities are how Mari and the app
 * discover what an integration can do without knowing the vendor behind it.
 */
export interface ConnectorCapability<Input = unknown, Output = unknown> {
  id: string;
  invoke(input: Input, ctx: ConnectorContext): Promise<ConnectorResult<Output>>;
}

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
  /** Cheap health/auth probe used by the integrations screen and by ops. */
  check(ctx: ConnectorContext): Promise<ConnectorStatus>;
  /** Capabilities this vendor implements, keyed by capability id. */
  capabilities: Record<string, ConnectorCapability>;
}

/** Runtime registry — callers resolve a connector by id, never by vendor SDK. */
export interface ConnectorRegistry {
  get(id: string): Connector | undefined;
  list(category?: ConnectorCategory): Connector[];
  register(connector: Connector): void;
}
