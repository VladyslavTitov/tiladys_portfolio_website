import { Footer } from './Footer';
import { Header } from './Header';

export function Shell({ locale, children,availableLocales,fallbackPath }: { availableLocales?:string[];fallbackPath?:string;locale: string; children: React.ReactNode }) {
  return <><Header locale={locale} availableLocales={availableLocales} fallbackPath={fallbackPath}/><main id="main-content">{children}</main><Footer locale={locale} /></>;
}
