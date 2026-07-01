/**
 * Módulo MARI (camada de IA) — API pública isomórfica.
 * Tools, intents e cálculos determinísticos rodam em qualquer runtime.
 * O serviço de chat (modelo/streaming) vive em `@/lib/mari/server`.
 */
export * from './tools';
export * from './intents';
export * from './impact';
export * from './briefing';
export * from './payer-rules';
