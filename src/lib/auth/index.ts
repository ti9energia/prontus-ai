/**
 * Módulo AUTH — API pública (isomórfica: edge middleware, rotas Node e client).
 * Entradas do módulo: `@/lib/auth` (este barrel) e `@/lib/auth/server` (Node-only).
 * Import profundo (`@/lib/auth/session` etc.) é proibido fora do módulo.
 */
export * from './session';
export * from './permissions';
