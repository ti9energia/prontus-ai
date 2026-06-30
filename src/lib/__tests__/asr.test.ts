import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isAsrReal, transcribeAudio } from '../asr';

const fetchMock = vi.fn();
global.fetch = fetchMock;

beforeEach(() => {
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isAsrReal', () => {
  it('returns false when ASR_PROVIDER is not set', () => {
    expect(isAsrReal()).toBe(false);
  });

  it('returns false for whisper without OPENAI_API_KEY', () => {
    vi.stubEnv('ASR_PROVIDER', 'whisper');
    expect(isAsrReal()).toBe(false);
  });

  it('returns true for whisper with OPENAI_API_KEY', () => {
    vi.stubEnv('ASR_PROVIDER', 'whisper');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    expect(isAsrReal()).toBe(true);
  });

  it('returns false for azure without both keys', () => {
    vi.stubEnv('ASR_PROVIDER', 'azure');
    vi.stubEnv('AZURE_SPEECH_KEY', 'key');
    expect(isAsrReal()).toBe(false);
  });

  it('returns true for azure with both keys', () => {
    vi.stubEnv('ASR_PROVIDER', 'azure');
    vi.stubEnv('AZURE_SPEECH_KEY', 'key');
    vi.stubEnv('AZURE_SPEECH_REGION', 'eastus');
    expect(isAsrReal()).toBe(true);
  });
});

describe('transcribeAudio — stub fallback', () => {
  it('returns stub when no provider configured', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob, 'pt-BR');
    expect(result.source).toBe('stub');
    expect(result.text).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns stub and logs when whisper API fails', async () => {
    vi.stubEnv('ASR_PROVIDER', 'whisper');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server error' });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob, 'pt-BR');
    expect(result.source).toBe('stub');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[asr]'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('returns whisper result on success', async () => {
    vi.stubEnv('ASR_PROVIDER', 'whisper');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'Doutora, estou com dor de cabeça.',
    });
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob, 'pt-BR');
    expect(result.source).toBe('whisper');
    expect(result.text).toBe('Doutora, estou com dor de cabeça.');
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain('openai.com');
  });

  it('returns azure result on success', async () => {
    vi.stubEnv('ASR_PROVIDER', 'azure');
    vi.stubEnv('AZURE_SPEECH_KEY', 'key');
    vi.stubEnv('AZURE_SPEECH_REGION', 'eastus');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ RecognitionStatus: 'Success', DisplayText: 'Tenho dor de cabeça.' }),
    });
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob, 'pt-BR');
    expect(result.source).toBe('azure');
    expect(result.text).toBe('Tenho dor de cabeça.');
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain('eastus.stt.speech.microsoft.com');
  });

  it('falls back to stub when fetch throws', async () => {
    vi.stubEnv('ASR_PROVIDER', 'whisper');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribeAudio(blob, 'pt-BR');
    expect(result.source).toBe('stub');
    consoleSpy.mockRestore();
  });
});
