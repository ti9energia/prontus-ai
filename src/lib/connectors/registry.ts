import type {
  Connector,
  ConnectorCategory,
  ConnectorContext,
  ConnectorRegistry,
  ConnectorStatus,
} from './types';

/**
 * Concrete connector registry (Block 4). Mock connectors stand in for real vendor
 * integrations; each implements the {@link Connector} contract so the app, Mari, and
 * the owner panel resolve integrations by id — never against a vendor SDK. Real API
 * keys belong in a server secret store (Block 8), never the localStorage snapshot.
 */
function mockConnector(id: string, name: string, category: ConnectorCategory): Connector {
  return {
    id,
    name,
    category,
    async check(ctx: ConnectorContext): Promise<ConnectorStatus> {
      return ctx.config && Object.keys(ctx.config).length > 0 ? 'connected' : 'disconnected';
    },
    capabilities: {},
  };
}

class Registry implements ConnectorRegistry {
  private map = new Map<string, Connector>();
  get(id: string) {
    return this.map.get(id);
  }
  list(category?: ConnectorCategory) {
    const all = [...this.map.values()];
    return category ? all.filter((c) => c.category === category) : all;
  }
  register(connector: Connector) {
    this.map.set(connector.id, connector);
  }
}

export const connectorRegistry: ConnectorRegistry = new Registry();

[
  mockConnector('whatsapp-cloud', 'WhatsApp Business (Cloud API)', 'messaging'),
  mockConnector('telegram', 'Telegram', 'messaging'),
  mockConnector('unimed-tiss', 'Unimed TISS', 'payer'),
  mockConnector('bradesco-tiss', 'Bradesco Saúde TISS', 'payer'),
  mockConnector('tasy', 'Tasy (Philips)', 'ehr'),
  mockConnector('mv-soul', 'MV Soul', 'ehr'),
  mockConnector('whisper', 'Whisper ASR', 'asr'),
  mockConnector('azure-speech', 'Azure Speech', 'asr'),
].forEach((c) => connectorRegistry.register(c));

export function listConnectors(category?: ConnectorCategory) {
  return connectorRegistry.list(category);
}
