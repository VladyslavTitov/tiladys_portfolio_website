import './globals.css';
import './rebuild.css';
import './refinement.css';
import NotFound from './[locale]/not-found';

export const metadata = { title: 'Page not found | TiLADYS', robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  return <html lang="en"><body><NotFound /></body></html>;
}
