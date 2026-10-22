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

  const segments = pathname.split('/').filter(Boolean);
  if (segments[1] === 'prices') {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${segments[0]}/services`;
    return NextResponse.redirect(destination, 308);
  }
  if (segments[1] === 'services' && segments.length === 3) {
    const replacement: Record<string, string> = {
      'it-support-diagnostics': 'pc-laptop',
      'data-backup': 'pc-laptop',
      'pc-cleaning-upgrades': 'pc-laptop',
      security: 'pc-laptop',
      'network-wifi': 'business-it',
      'google-business': 'business-it',
      'business-photography': 'business-it',
      'digital-design': 'business-it',
      'training-consulting': 'business-it',
    };
    if (Object.prototype.hasOwnProperty.call(replacement, segments[2])) {
      const destination = request.nextUrl.clone();
      destination.pathname = `/${segments[0]}/services${replacement[segments[2]] ? `/${replacement[segments[2]]}` : ''}`;
      return NextResponse.redirect(destination, 308);
    }
  }
  const locale = pathname.split('/')[1];
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tiladys-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
