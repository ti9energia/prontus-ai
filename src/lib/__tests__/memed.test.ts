import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMemedReal,
  createPrescription,
  signPrescription,
  sendPrescription,
  type MemedMedication,
} from '../connectors/memed';

const MEDS: MemedMedication[] = [
  { name: 'Losartana', dose: '50mg', frequency: '1x ao dia', duration: '30 dias' },
  { name: 'Metformina', dose: '850mg', frequency: '2x ao dia', duration: '30 dias' },
];

describe('isMemedReal', () => {
  it('returns false when MEMED_TOKEN is absent', () => {
    delete process.env.MEMED_TOKEN;
    expect(isMemedReal()).toBe(false);
  });

  it('returns true when MEMED_TOKEN is set', () => {
    process.env.MEMED_TOKEN = 'test_token_abc';
    expect(isMemedReal()).toBe(true);
    delete process.env.MEMED_TOKEN;
  });
});

describe('createPrescription (stub mode)', () => {
  beforeEach(() => {
    delete process.env.MEMED_TOKEN;
  });

  it('returns a prescription with correct structure', async () => {
    const p = await createPrescription('patient_1', MEDS);
    expect(p.id).toMatch(/^memed_stub_/);
    expect(p.patientId).toBe('patient_1');
    expect(p.medications).toHaveLength(2);
    expect(p.status).toBe('draft');
    expect(p.signedAt).toBeUndefined();
    expect(p.url).toBeUndefined();
  });

  it('generates unique ids on each call', async () => {
    const a = await createPrescription('p1', MEDS);
    const b = await createPrescription('p1', MEDS);
    expect(a.id).not.toBe(b.id);
  });

  it('preserves medication data', async () => {
    const p = await createPrescription('patient_1', MEDS);
    expect(p.medications[0].name).toBe('Losartana');
    expect(p.medications[0].dose).toBe('50mg');
    expect(p.medications[1].frequency).toBe('2x ao dia');
  });
});

describe('signPrescription (stub mode)', () => {
  beforeEach(() => {
    delete process.env.MEMED_TOKEN;
  });

  it('transitions status to signed', async () => {
    const draft = await createPrescription('patient_1', MEDS);
    const signed = await signPrescription(draft);
    expect(signed.status).toBe('signed');
  });

  it('populates signedAt, url, token', async () => {
    const draft = await createPrescription('patient_1', MEDS);
    const signed = await signPrescription(draft);
    expect(signed.signedAt).toBeDefined();
    expect(signed.url).toMatch(/memed\.com\.br/);
    expect(signed.token).toMatch(/^tok_/);
  });

  it('preserves id and medications', async () => {
    const draft = await createPrescription('patient_1', MEDS);
    const signed = await signPrescription(draft);
    expect(signed.id).toBe(draft.id);
    expect(signed.medications).toEqual(MEDS);
  });
});

describe('sendPrescription (stub mode)', () => {
  beforeEach(() => {
    delete process.env.MEMED_TOKEN;
  });

  it('transitions status to sent', async () => {
    const draft = await createPrescription('patient_1', MEDS);
    const signed = await signPrescription(draft);
    const sent = await sendPrescription(signed, 'whatsapp', '+5511999998888');
    expect(sent.status).toBe('sent');
  });

  it('records sentAt and sentChannel', async () => {
    const draft = await createPrescription('patient_1', MEDS);
    const signed = await signPrescription(draft);
    const sent = await sendPrescription(signed, 'email', 'patient@email.com');
    expect(sent.sentAt).toBeDefined();
    expect(sent.sentChannel).toBe('email');
  });

  it('supports all three channels', async () => {
    const channels = ['sms', 'email', 'whatsapp'] as const;
    for (const ch of channels) {
      const draft = await createPrescription('p1', MEDS);
      const signed = await signPrescription(draft);
      const sent = await sendPrescription(signed, ch, 'contact');
      expect(sent.sentChannel).toBe(ch);
    }
  });
});

describe('createPrescription (real mode — fetch stub)', () => {
  afterEach(() => {
    delete process.env.MEMED_TOKEN;
    vi.restoreAllMocks();
  });

  it('calls Memed API with correct payload', async () => {
    process.env.MEMED_TOKEN = 'real_token';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'memed_real_123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const p = await createPrescription('pat_abc', MEDS);
    expect(p.id).toBe('memed_real_123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/prescricoes'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-ok API response', async () => {
    process.env.MEMED_TOKEN = 'real_token';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await expect(createPrescription('pat_abc', MEDS)).rejects.toThrow('Memed API error 401');
  });
});
