import { NextRequest, NextResponse } from 'next/server';
import { locales, type Locale } from '@tiladys/shared';

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function proxy(request: NextRequest) {
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
