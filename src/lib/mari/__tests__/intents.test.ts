import { describe, it, expect } from 'vitest';
import { detectNavIntent } from '@/lib/mari/intents';

/** Block 6 — Mari navigates the app on explicit commands. */
describe('Mari navigation intents', () => {
  it('navigates on explicit commands (4 languages)', () => {
    expect(detectNavIntent('abre o faturamento')).toBe('billing');
    expect(detectNavIntent('open the patients screen')).toBe('patients');
    expect(detectNavIntent('me leva para a agenda')).toBe('agenda');
    expect(detectNavIntent('mostrar relatórios')).toBe('reports');
    expect(detectNavIntent('ouvrir les patients')).toBe('patients');
  });

  it('ignores questions that have no navigation verb', () => {
    expect(detectNavIntent('quantas glosas eu tive?')).toBeNull();
    expect(detectNavIntent('what is my denial rate?')).toBeNull();
  });

  it('returns null when no screen matches the command', () => {
    expect(detectNavIntent('abre o foobar')).toBeNull();
  });
});
