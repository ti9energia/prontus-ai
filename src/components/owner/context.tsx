'use client';

import * as React from 'react';

interface OwnerCtx {
  impersonating: string | null;
  setImpersonating: (name: string | null) => void;
  /** Tenant currently open for configuration in the admin panel (per-tenant config, Block 4). */
  activeTenantId: string | null;
  setActiveTenant: (id: string | null) => void;
}

const Ctx = React.createContext<OwnerCtx>({
  impersonating: null,
  setImpersonating: () => {},
  activeTenantId: null,
  setActiveTenant: () => {},
});

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const [impersonating, setImpersonating] = React.useState<string | null>(null);
  const [activeTenantId, setActiveTenant] = React.useState<string | null>(null);
  return (
    <Ctx.Provider value={{ impersonating, setImpersonating, activeTenantId, setActiveTenant }}>
      {children}
    </Ctx.Provider>
  );
}

export const useOwner = () => React.useContext(Ctx);
