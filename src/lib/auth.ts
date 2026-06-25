'use client';

import * as React from 'react';

/**
 * Client-side session state. The real auth lives server-side (signed httpOnly
 * cookie verified in middleware + route handlers); this hook just reflects it
 * for UI gating. The cookie itself is not readable from JS by design.
 */

export type Role = 'owner' | 'doctor';

export interface SessionInfo {
  loading: boolean;
  authed: boolean;
  role: Role | null;
  email: string | null;
  name: string | null;
}

const EMPTY: SessionInfo = { loading: true, authed: false, role: null, email: null, name: null };

export function useSession() {
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
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

export async function signOut() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    /* noop */
  }
}
