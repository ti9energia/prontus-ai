/**
 * Módulo CONNECTORS — API pública client-safe: contratos, registry e tipos.
 * As implementações (fetch/env/node:crypto) vivem em `@/lib/connectors/server`.
 */
export * from './types';
export * from './registry';
export type { IcpSource, IcpSignResult } from './icp';
export type {
  MemedMedication,
  MemedPrescription,
  MemedPrescriptionStatus,
  MemedSendChannel,
} from './memed';
export type { WhatsappMessage, WhatsappInboundMessage, WhatsappSendResult } from './whatsapp';
