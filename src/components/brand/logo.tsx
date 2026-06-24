import { cn } from '@/lib/utils';

/** Prontus.ai mark — a clinical pulse captured inside a soft squircle. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="0.55" stopColor="#0d9488" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#pg)" />
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#pg)" />
      <path
        d="M7 21.5h5.2l2.4-7.4a1 1 0 0 1 1.9.05l3.9 13.2a1 1 0 0 0 1.9.04l2.3-6.4a1 1 0 0 1 .94-.66H33"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="33" cy="20.4" r="2.1" fill="#fb7185" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}

export function Logo({
  className,
  size = 32,
  textClassName,
  hideText,
}: {
  className?: string;
  size?: number;
  textClassName?: string;
  hideText?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {!hideText && (
        <span className={cn('font-display text-[1.05rem] font-bold tracking-tight', textClassName)}>
          Prontus<span className="text-brand-500">.ai</span>
        </span>
      )}
    </span>
  );
}
