import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { SESSION_COOKIE, verifySession } from './lib/auth';

const intl = createMiddleware(routing);

/** Locale-aware path helpers. */
function localeOf(pathname: string): string {
  const seg = pathname.split('/')[1];
  return (routing.locales as readonly string[]).includes(seg) ? seg : routing.defaultLocale;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = localeOf(pathname);
  const sub = pathname.startsWith(`/${locale}`) ? pathname.slice(locale.length + 1) : pathname;

  const isOwner = sub === '/owner' || sub.startsWith('/owner/');
  const isApp = sub === '/app' || sub.startsWith('/app/');

  if (isOwner || isApp) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    const ok = !!session && (isOwner ? session.role === 'owner' : true);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return intl(req);
}

export const config = {
  // Run on everything except API, Next internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
