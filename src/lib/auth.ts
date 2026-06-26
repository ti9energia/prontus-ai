'use client';

import * as React from 'react';

/**
 * Client-side session state. The real auth lives server-side (signed httpOnly
 * cookie verified in middleware + route handlers); this hook just reflects it
 * for UI gating. The cookie itself is not readable from JS by design.
 *
 * Wrap authenticated areas in <SessionProvider> so the many useSession() callers
 * share ONE fetch instead of each firing its own; standalone callers (e.g. the
 * login form) still work via a local fallback fetch.
 */

export type Role = 'owner' | 'doctor';

export interface SessionInfo {
  loading: boolean;
  authed: boolean;
  role: Role | null;
  email: string | null;
  name: string | null;
}

export interface SessionValue extends SessionInfo {
  refetch: () => Promise<void>;
}

const EMPTY: SessionInfo = { loading: true, authed: false, role: null, email: null, name: null };

/** Owns the actual request. `enabled=false` keeps the hook inert (no fetch). */
function useSessionState(enabled: boolean): SessionValue {
  const [state, setState] = React.useState<SessionInfo>(EMPTY);

  const refetch = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await res.json();
      setState({
        loading: false,
        authed: !!data.authed,
        role: (data.role as Role) ?? null,
        email: data.email ?? null,
        name: data.name ?? null,
      });
    } catch {
      setState({ loading: false, authed: false, role: null, email: null, name: null });
    }
  }, []);

  React.useEffect(() => {
    if (enabled) refetch();
  }, [enabled, refetch]);

  return { ...state, refetch };
}

const SessionContext = React.createContext<SessionValue | null>(null);

/** Provides a single shared session fetch to its subtree. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionState(true);
  return React.createElement(SessionContext.Provider, { value }, children);
}

/**
 * Reflects server-side auth for UI gating. Uses the nearest SessionProvider when
 * present (shared fetch); otherwise falls back to its own fetch.
 */
export function useSession(): SessionValue {
  const ctx = React.useContext(SessionContext);
  const own = useSessionState(ctx === null); // only fetches when there's no provider
  return ctx ?? own;
}

export async function signOut() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    /* noop */
  }
}
