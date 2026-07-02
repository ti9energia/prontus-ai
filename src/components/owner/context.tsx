'use client';

import * as React from 'react';

export type SectionKey =
  | 'overview'
  | 'mari'
  | 'tenants'
  | 'plans'
  | 'landing'
  | 'flags'
  | 'ai'
  | 'whatsapp'
  | 'access'
  | 'audit';

/** Tenant assumed via impersonation — id is the stable reference, name is for display. */
export interface ImpersonationTarget {
  id: string;
  name: string;
}

interface OwnerCtx {
  impersonating: ImpersonationTarget | null;
  setImpersonating: (target: ImpersonationTarget | null) => void;
  /** Tenant currently open for configuration in the admin panel (per-tenant config, Block 4). */
  activeTenantId: string | null;
  setActiveTenant: (id: string | null) => void;
  /** Active panel section — shared so KPIs and banners can deep-link into sections. */
  section: SectionKey;
  setSection: (section: SectionKey) => void;
}

const Ctx = React.createContext<OwnerCtx>({
  impersonating: null,
  setImpersonating: () => {},
  activeTenantId: null,
  setActiveTenant: () => {},
  section: 'mari',
  setSection: () => {},
});

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const [impersonating, setImpersonating] = React.useState<ImpersonationTarget | null>(null);
  const [activeTenantId, setActiveTenant] = React.useState<string | null>(null);
  // The owner lands on Mari — the operating brain greets them first.
  const [section, setSection] = React.useState<SectionKey>('mari');
  return (
    <Ctx.Provider
      value={{ impersonating, setImpersonating, activeTenantId, setActiveTenant, section, setSection }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useOwner = () => React.useContext(Ctx);
