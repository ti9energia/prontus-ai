import { LogoMark } from './logo';

/**
 * Auronis loading screen — a living DNA pulse, never a dead white flash.
 * The chromed mark glows inside a spinning helix ring over a turquoise aurora.
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-bg">
      <div className="bg-aurora pointer-events-none absolute inset-0 opacity-50" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.04] [background-size:44px_44px]" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative grid h-28 w-28 place-items-center">
          <div className="absolute inset-0 rounded-full bg-brand-500/25 blur-2xl animate-pulse" />
          {/* spinning helix ring */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow text-brand-400/60" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 7" strokeLinecap="round" />
          </svg>
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-[10%] h-[80%] w-[80%] animate-spin-slow text-accent-400/45 [animation-direction:reverse] [animation-duration:13s]"
            aria-hidden
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 9" />
          </svg>
          <LogoMark size={56} className="relative z-10 animate-glow-pulse drop-shadow-[0_8px_28px_rgba(20,200,196,0.5)]" />
        </div>
        <div className="flex flex-col items-center gap-2.5">
          <p className="font-display text-lg font-bold tracking-tight text-ink">
            AURONIS <span className="text-brand-400">HEALTH</span>
          </p>
          <div className="flex items-center gap-1.5" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
