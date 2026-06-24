import { describe, it, expect } from 'vitest';
import {
  closePane,
  closeTab,
  getState,
  openTab,
  splitActivePane,
  MAX_WORKSPACE_PANES,
} from '@/lib/workspace/store';

describe('workspace store (tabs + split)', () => {
  it('starts with one pane and a "today" tab', () => {
    const s = getState();
    expect(s.panes).toHaveLength(1);
    expect(s.panes[0].tabs[0].screen).toBe('today');
  });

  it('opens a new tab and dedupes repeats', () => {
    const before = getState().panes[0].tabs.length;
    openTab('patients');
    expect(getState().panes[0].tabs.length).toBe(before + 1);

    openTab('patients'); // same screen → focus existing, no new tab
    expect(getState().panes[0].tabs.length).toBe(before + 1);

    const pane = getState().panes[0];
    const active = pane.tabs.find((t) => t.id === pane.activeTabId)!;
    expect(active.screen).toBe('patients');
  });

  it('splits into a second pane and closes it', () => {
    splitActivePane('billing');
    expect(getState().panes).toHaveLength(2);
    const second = getState().panes[1];
    expect(second.tabs[0].screen).toBe('billing');

    closePane(second.id);
    expect(getState().panes).toHaveLength(1);
  });

  it('never leaves a pane empty (falls back to "today")', () => {
    const pane = getState().panes[0];
    [...pane.tabs].forEach((t) => closeTab(pane.id, t.id));
    const p = getState().panes[0];
    expect(p.tabs.length).toBeGreaterThanOrEqual(1);
    expect(p.tabs[0].screen).toBe('today');
  });

  it('caps the number of panes at MAX_WORKSPACE_PANES', () => {
    while (getState().panes.length < MAX_WORKSPACE_PANES) splitActivePane();
    const capped = getState().panes.length;
    splitActivePane(); // beyond the cap → ignored
    expect(getState().panes.length).toBe(capped);
    expect(capped).toBe(MAX_WORKSPACE_PANES);
  });
});
