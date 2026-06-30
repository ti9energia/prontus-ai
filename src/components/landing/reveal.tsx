'use client';

import * as React from 'react';
import { useEffect, useRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// Single-element fade-up reveal on scroll (replaces framer-motion).
// CSS transition fires once when IntersectionObserver fires [data-in].
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-in', '');
          obs.disconnect();
        }
      },
      { rootMargin: '-80px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn('rv', className)}
      style={delay ? ({ '--rv-delay': `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

// Stagger-reveal container: sets [data-in] on itself, which triggers
// staggered transitions on each RevealItem child via --rv-delay injected per-child.
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-in', '');
          obs.disconnect();
        }
      },
      { rootMargin: '-80px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = React.Children.toArray(children);
  return (
    <div ref={ref} className={cn('rv-stagger', className)}>
      {items.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ style?: CSSProperties }>, {
              style: {
                ...(child.props.style ?? {}),
                '--rv-delay': `${(i * stagger).toFixed(3)}s`,
              } as CSSProperties,
            })
          : child,
      )}
    </div>
  );
}

// Stagger child — used inside RevealStagger.
export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('rvi', className)}>{children}</div>;
}
