import { describe, expect, it } from 'vitest';
import { CreateExtractionSchemaRequest } from '../contracts';

describe('B2B extraction schema contract', () => {
  it('accepts a generic nutrition intake schema', () => {
    const parsed = CreateExtractionSchemaRequest.safeParse({
      name: 'Anamnese FitNutri',
      fields: [
        { key: 'objetivo', label: 'Objetivo', type: 'long_text', required: true },
        { key: 'peso_atual_kg', label: 'Peso atual', type: 'number' },
        { key: 'restricoes', label: 'Restrições', type: 'multi_select', options: ['lactose', 'glúten'] },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects duplicate keys and select fields without options', () => {
    const parsed = CreateExtractionSchemaRequest.safeParse({
      name: 'Inválido',
      fields: [
        { key: 'campo', label: 'Campo 1', type: 'single_select' },
        { key: 'campo', label: 'Campo 2', type: 'string' },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
