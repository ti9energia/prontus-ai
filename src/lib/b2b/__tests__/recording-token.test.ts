import { describe, expect, it } from 'vitest';
import { issueRecordingToken, verifyRecordingToken } from '../recording-token';

describe('short-lived recording token', () => {
  it('round-trips a signed job scope', () => {
    const issued = issueRecordingToken({
      jobId: 'job_1',
      orgId: 'org_1',
      allowedOrigins: ['https://app.fitnutri.example'],
    });
    expect(issued.token).toMatch(/^rec_/);
    expect(verifyRecordingToken(issued.token)).toMatchObject({ jobId: 'job_1', orgId: 'org_1' });
  });

  it('rejects a modified signature', () => {
    const issued = issueRecordingToken({ jobId: 'job_1', orgId: 'org_1', allowedOrigins: [] });
    expect(verifyRecordingToken(`${issued.token}x`)).toBeNull();
  });
});
