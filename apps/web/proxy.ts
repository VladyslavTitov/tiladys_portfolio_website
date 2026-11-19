import { NextRequest, NextResponse } from 'next/server';
import { locales, type Locale } from '@tiladys/shared';

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function proxy(request: NextRequest) {
  // Preserve the requested path and query while consolidating the public Vercel alias.
  // Do not redirect branch previews or other development deployments.
  if (request.nextUrl.hostname === 'tiladys-public.vercel.app') {
    const destination = request.nextUrl.clone();
    destination.protocol = 'https:';
    destination.hostname = 'tiladys.com';
    destination.port = '';
    return NextResponse.redirect(destination, 308);
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next();

  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (!hasLocale) {
    const browserLanguage = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ?? 'en';
    const locale: Locale = isLocale(browserLanguage) ? browserLanguage : 'en';
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
