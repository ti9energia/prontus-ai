import { config } from '@/lib/config';
/**
 * Memed electronic prescription seam.
 *
 * Activates when MEMED_TOKEN is set (optionally MEMED_PUBLIC_TOKEN + MEMED_API_URL).
 * Absent → deterministic stub that returns realistic fake prescription data so the
 * rest of the app works identically without credentials.
 */

export interface MemedMedication {
  name: string;
  dose?: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export type MemedPrescriptionStatus = 'draft' | 'signed' | 'sent';
export type MemedSendChannel = 'sms' | 'email' | 'whatsapp';

export interface MemedPrescription {
  id: string;
  patientId: string;
  medications: MemedMedication[];
  status: MemedPrescriptionStatus;
  signedAt?: string;
  url?: string;
  token?: string;
  sentAt?: string;
  sentChannel?: MemedSendChannel;
}

export function isMemedReal(): boolean {
  return !!(config.memed.token);
}

let _seq = 1000;
function stubId() {
  return `memed_stub_${(_seq += 1)}`;
}

export async function createPrescription(
  patientId: string,
  medications: MemedMedication[],
): Promise<MemedPrescription> {
  if (isMemedReal()) {
    const token = config.memed.token!;
    const base = config.memed.apiUrl;
    const publicToken = config.memed.publicToken;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (publicToken) headers['X-Public-Token'] = publicToken;

    const res = await fetch(`${base}/prescricoes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        paciente_id: patientId,
        medicamentos: medications.map((m) => ({
          nome: m.name,
          dose: m.dose,
          posologia: m.frequency,
          duracao: m.duration,
          instrucoes: m.instructions,
        })),
      }),
    });

    if (!res.ok) throw new Error(`Memed API error ${res.status}`);
    const data = (await res.json()) as { id: string };
    return { id: data.id, patientId, medications, status: 'draft' };
  }

  return { id: stubId(), patientId, medications, status: 'draft' };
}

export async function signPrescription(prescription: MemedPrescription): Promise<MemedPrescription> {
  if (isMemedReal()) {
    const token = config.memed.token!;
    const base = config.memed.apiUrl;

    const res = await fetch(`${base}/prescricoes/${prescription.id}/assinar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Memed sign error ${res.status}`);
    const data = (await res.json()) as { url?: string; token?: string };
    return {
      ...prescription,
      signedAt: new Date().toISOString(),
      url: data.url,
      token: data.token,
      status: 'signed',
    };
  }

  return {
    ...prescription,
    signedAt: new Date().toISOString(),
    url: `https://memed.com.br/prescricao/${prescription.id}.pdf`,
    token: `tok_${prescription.id}`,
    status: 'signed',
  };
}

export async function sendPrescription(
  prescription: MemedPrescription,
  channel: MemedSendChannel,
  contact: string,
): Promise<MemedPrescription> {
  if (isMemedReal()) {
    const token = config.memed.token!;
    const base = config.memed.apiUrl;

    const res = await fetch(`${base}/prescricoes/${prescription.id}/enviar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ canal: channel, contato: contact }),
    });

    if (!res.ok) throw new Error(`Memed send error ${res.status}`);
  }

  return {
    ...prescription,
    sentAt: new Date().toISOString(),
    sentChannel: channel,
    status: 'sent',
  };
}
