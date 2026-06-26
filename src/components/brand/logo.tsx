import { cn } from '@/lib/utils';

/** Auronis Health mark — the chromed "A" with a turquoise ECG pulse (transparent PNG). */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/symbol.png"
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('shrink-0 select-none object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({
  className,
  size = 30,
  textClassName,
  hideText,
}: {
  className?: string;
  size?: number;
  textClassName?: string;
  hideText?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {!hideText && (
        <span className={cn('font-display text-[1.05rem] font-bold tracking-tight text-ink', textClassName)}>
          AURONIS
          <span className="ml-1.5 align-middle text-[0.72em] font-semibold tracking-[0.22em] text-brand-500 dark:text-brand-400">
            HEALTH
          </span>
        </span>
      )}
    </span>
  );
}
