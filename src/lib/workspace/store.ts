'use client';

import * as React from 'react';

export type ScreenKey =
  | 'today'
  | 'agenda'
  | 'encounter'
  | 'review'
  | 'tiss'
  | 'patients'
  | 'billing'
  | 'reports'
  | 'templates'
  | 'integrations'
  | 'settings'
  | 'agent'
  | 'whatsapp'
  | 'documents'
  | 'signature'
  | 'automations';

export interface Tab {
  id: string;
  screen: ScreenKey;
  params?: Record<string, string>;
}

export interface Pane {
  id: string;
  tabs: Tab[];
  activeTabId: string;
}

export interface WorkspaceState {
  panes: Pane[];
  activePaneId: string;
}

const STORAGE_KEY = 'auronis-workspace-v1';
const MAX_PANES = 3;

let seq = 1;
const uid = (p: string) => `${p}_${seq++}_${Math.floor(Math.random() * 1e6).toString(36)}`;

function defaultState(): WorkspaceState {
  const tab: Tab = { id: uid('tab'), screen: 'today' };
  const pane: Pane = { id: uid('pane'), tabs: [tab], activeTabId: tab.id };
  return { panes: [pane], activePaneId: pane.id };
}

let state: WorkspaceState = defaultState();
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function set(next: WorkspaceState) {
  state = next;
  emit();
}

export function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed?.panes?.length && parsed.activePaneId) {
        // make sure seq won't collide
        state = parsed;
        emit();
      }
    }
  } catch {}
}

/* --------------------------- selectors --------------------------- */
export function getState() {
  return state;
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useWorkspace() {
  return React.useSyncExternalStore(subscribe, getState, getState);
}

/* --------------------------- actions --------------------------- */
function findPane(s: WorkspaceState, paneId?: string) {
  return s.panes.find((p) => p.id === (paneId ?? s.activePaneId)) ?? s.panes[0];
}

export function focusPane(paneId: string) {
  if (state.activePaneId === paneId) return;
  set({ ...state, activePaneId: paneId });
}

export function setActiveTab(paneId: string, tabId: string) {
  set({
    ...state,
    activePaneId: paneId,
    panes: state.panes.map((p) => (p.id === paneId ? { ...p, activeTabId: tabId } : p)),
  });
}

export function openTab(
  screen: ScreenKey,
  params?: Record<string, string>,
  opts?: { paneId?: string; dedupe?: boolean },
) {
  const dedupe = opts?.dedupe ?? true;
  const pane = findPane(state, opts?.paneId);
  if (dedupe) {
    const existing = pane.tabs.find(
      (t) => t.screen === screen && JSON.stringify(t.params ?? {}) === JSON.stringify(params ?? {}),
    );
    if (existing) {
      setActiveTab(pane.id, existing.id);
      return existing.id;
    }
  }
  const tab: Tab = { id: uid('tab'), screen, params };
  set({
    ...state,
    activePaneId: pane.id,
    panes: state.panes.map((p) =>
      p.id === pane.id ? { ...p, tabs: [...p.tabs, tab], activeTabId: tab.id } : p,
    ),
  });
  return tab.id;
}

export function closeTab(paneId: string, tabId: string) {
  const pane = state.panes.find((p) => p.id === paneId);
  if (!pane) return;
  const idx = pane.tabs.findIndex((t) => t.id === tabId);
  const remaining = pane.tabs.filter((t) => t.id !== tabId);

  // If pane becomes empty
  if (remaining.length === 0) {
    if (state.panes.length > 1) {
      const panes = state.panes.filter((p) => p.id !== paneId);
      set({ ...state, panes, activePaneId: panes[0].id });
    } else {
      // never leave the workspace empty
      const tab: Tab = { id: uid('tab'), screen: 'today' };
      set({
        ...state,
        panes: [{ ...pane, tabs: [tab], activeTabId: tab.id }],
      });
    }
    return;
  }

  const newActive =
    pane.activeTabId === tabId
      ? remaining[Math.min(idx, remaining.length - 1)].id
      : pane.activeTabId;
  set({
    ...state,
    panes: state.panes.map((p) =>
      p.id === paneId ? { ...p, tabs: remaining, activeTabId: newActive } : p,
    ),
  });
}

export function splitActivePane(screen?: ScreenKey) {
  if (state.panes.length >= MAX_PANES) return;
  const active = findPane(state);
  const activeTab = active.tabs.find((t) => t.id === active.activeTabId);
  const newTab: Tab = screen
    ? { id: uid('tab'), screen }
    : { id: uid('tab'), screen: activeTab?.screen ?? 'today', params: activeTab?.params };
  const newPane: Pane = { id: uid('pane'), tabs: [newTab], activeTabId: newTab.id };
  const idx = state.panes.findIndex((p) => p.id === active.id);
  const panes = [...state.panes];
  panes.splice(idx + 1, 0, newPane);
  set({ ...state, panes, activePaneId: newPane.id });
}

export function closePane(paneId: string) {
  if (state.panes.length <= 1) return;
  const panes = state.panes.filter((p) => p.id !== paneId);
  set({ ...state, panes, activePaneId: panes[0].id });
}

export function moveTabToPane(fromPaneId: string, tabId: string, toPaneId: string) {
  if (fromPaneId === toPaneId) return;
  const from = state.panes.find((p) => p.id === fromPaneId);
  const to = state.panes.find((p) => p.id === toPaneId);
  if (!from || !to) return;
  const tab = from.tabs.find((t) => t.id === tabId);
  if (!tab) return;
  const fromRemaining = from.tabs.filter((t) => t.id !== tabId);
  let panes = state.panes.map((p) => {
    if (p.id === fromPaneId)
      return {
        ...p,
        tabs: fromRemaining,
        activeTabId: fromRemaining[0]?.id ?? '',
      };
    if (p.id === toPaneId) return { ...p, tabs: [...p.tabs, tab], activeTabId: tab.id };
    return p;
  });
  panes = panes.filter((p) => p.tabs.length > 0);
  set({ ...state, panes, activePaneId: toPaneId });
}

export const MAX_WORKSPACE_PANES = MAX_PANES;
