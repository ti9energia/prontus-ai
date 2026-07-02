import { notFound } from 'next/navigation';

/**
 * Next.js App Router doesn't auto-render a nested not-found.tsx (this one
 * lives at ../not-found.tsx) for sub-paths that match no page inside a
 * dynamic segment folder like [locale] — only an explicit notFound() call
 * does (known limitation: vercel/next.js#54980, #57938). This catch-all
 * exists solely to make that call, so unmatched routes under /[locale]/*
 * get the real localized 404 instead of Next's generic fallback.
 *
 * force-dynamic: without it, Next statically optimizes this route and the
 * response ships as a cached 200 (confirmed via Playwright — the not-found
 * UI rendered, but res.status() was 200, not 404). A real per-request
 * render is required for the 404 status to actually reach the client.
 */
export const dynamic = 'force-dynamic';

export default function CatchAll(): never {
  notFound();
}
