import { notFound } from 'next/navigation';

/**
 * Next.js App Router doesn't auto-render a nested not-found.tsx (this one
 * lives at ../not-found.tsx) for sub-paths that match no page inside a
 * dynamic segment folder like [locale] — only an explicit notFound() call
 * does (known limitation: vercel/next.js#54980, #57938). This catch-all
 * exists solely to make that call, so unmatched routes under /[locale]/*
 * get the real localized 404 instead of Next's generic fallback.
 */
export default function CatchAll(): never {
  notFound();
}
