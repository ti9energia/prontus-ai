'use client';

import * as React from 'react';

interface OwnerCtx {
  impersonating: string | null;
  setImpersonating: (name: string | null) => void;
}

const Ctx = React.createContext<OwnerCtx>({ impersonating: null, setImpersonating: () => {} });

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const [impersonating, setImpersonating] = React.useState<string | null>(null);
  return <Ctx.Provider value={{ impersonating, setImpersonating }}>{children}</Ctx.Provider>;
}

export const useOwner = () => React.useContext(Ctx);
