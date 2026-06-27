import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStore,
  listGuides,
  getGuide,
  requestAuthorization,
  reviewAuthorization,
  decideAuthorization,
} from '@/lib/data/store';

/** Block 5 — requisition / prior-authorization state machine. */
describe('requisition / prior-authorization workflow', () => {
  beforeEach(() => resetStore());

  it('runs request → review → authorize and stamps an auth number', () => {
    const gid = listGuides()[0].id;
    expect(getGuide(gid)!.authStatus).toBeUndefined();
    requestAuthorization(gid);
    expect(getGuide(gid)!.authStatus).toBe('requested');
    reviewAuthorization(gid);
    expect(getGuide(gid)!.authStatus).toBe('in_review');
    decideAuthorization(gid, 'authorized');
    const g = getGuide(gid)!;
    expect(g.authStatus).toBe('authorized');
    expect(g.authNumber).toBeTruthy();
    expect(g.authorizedBy).toBeTruthy();
  });

  it('can deny without an auth number', () => {
    const gid = listGuides()[0].id;
    requestAuthorization(gid);
    reviewAuthorization(gid);
    decideAuthorization(gid, 'denied');
    const g = getGuide(gid)!;
    expect(g.authStatus).toBe('denied');
    expect(g.authNumber).toBeUndefined();
  });
});
