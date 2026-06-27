# Modularity & how to extract a feature

Auronis is a **modular monolith**: each tab/function is a self-contained feature that can be toggled, copied, or lifted to another system without surgery. This is the "fácil manutenção / desacoplável" guarantee.

## The boundaries of a feature (a "screen")

- **UI** — `src/components/screens/<feature>.tsx`: one exported component, registered in `src/components/workspace/registry.tsx` (`SCREENS` + `SCREEN_ORDER`) and keyed in `src/lib/workspace/store.ts` (`ScreenKey`).
- **Contract / data** — domain types in `src/lib/types.ts`; data access + mutations in `src/lib/data/store.ts` (the repository — swappable for the Postgres adapter, Block 8).
- **AI** — tools the feature exposes to Mari live in `src/lib/mari/tools.ts` (one registry, permission-gated by `surfaces`).
- **Permissions** — the single matrix in `src/lib/auth/permissions.ts`; screen gating in `src/lib/workspace/entitlements.ts` (`SCREEN_PERMISSION` + plan/flag).
- **Integrations** — external systems behind the `src/lib/connectors/*` contract + registry, never a vendor SDK directly.
- **Events** — cross-feature comms via `src/lib/events/bus.ts` (publish/subscribe). No feature imports another feature's internals.

## To copy a tab into another system

1. Take `screens/<feature>.tsx` + its slice of `types.ts` + its `store.ts` functions + its `mari/tools.ts` tools + its `permissions` entries.
2. Register it in the target's registry; point its store functions at the target's repository.
3. Because features talk only through **types, the registry, the tools registry, the permission matrix, the connector contract, and the event bus**, nothing else has to move.

## To turn a feature off

Flip its feature flag / plan entitlement in the owner panel — `entitlements.ts` removes it from the rail, the command palette, and (with role gating) per role. No code change.

## The AI is already detachable

`src/lib/mari/service.ts` is a provider seam: set `MARI_API_URL` to run Mari as a **separate service** (own server, own training) with zero product changes; it falls back to the Anthropic API, then to a deterministic mock.
