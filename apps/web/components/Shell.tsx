import { Footer } from './Footer';
import { Header } from './Header';

export function Shell({ locale, children }: { locale: string; children: React.ReactNode }) {
  return <><Header locale={locale} /><main>{children}</main><Footer locale={locale} /></>;
}
