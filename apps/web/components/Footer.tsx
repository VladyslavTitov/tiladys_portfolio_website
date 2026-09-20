import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { SocialLinks } from './SocialLinks';
import { t } from '@/lib/i18n';

export function Footer({ locale }: { locale: string }) {
  const c = t(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <section className="footer-brand-column" aria-label="TiLADYS">
          <Link href={`/${locale}`} className="footer-logo">
            <Image src="/brand/icon.svg" width={445} height={106} alt="TiLADYS" />
          </Link>
          <strong>IT Services &amp; Webdesign</strong>
          <p>{c.footer.tagline}</p>
          <Image className="footer-mark" src="/brand/logo.svg" width={82} height={61} alt="" aria-hidden="true" />
        </section>

        <section className="footer-column">
          <h2>{c.footer.contactTitle}</h2>
          <a href="mailto:contact@tiladys.com" className="footer-contact-link">
            <Mail aria-hidden="true" size={19} />
            <span>contact@tiladys.com</span>
          </a>
          <a href="tel:+491637235608" className="footer-contact-link">
            <Phone aria-hidden="true" size={19} />
            <span>+49 163 7235608</span>
          </a>
          <div className="footer-contact-link">
            <MapPin aria-hidden="true" size={20} />
            <span>{c.footer.location}</span>
          </div>
        </section>

        <section className="footer-column">
          <h2>{c.footer.linksTitle}</h2>
          {c.nav.map((name: string, index: number) => {
            const routes = ['', 'services', 'portfolio', 'about', 'contact'];
            const suffix = routes[index];
            return (
              <Link key={name} href={suffix ? `/${locale}/${suffix}` : `/${locale}`}>
                {name}
              </Link>
            );
          })}
        </section>

        <section className="footer-column">
          <h2>{c.footer.socialTitle}</h2>
          <SocialLinks />
        </section>

        <section className="footer-column footer-legal-column">
          <h2>{c.footer.legalTitle}</h2>
          <Link href={`/${locale}/terms`}>{c.footer.terms}</Link>
          <Link href={`/${locale}/privacy`}>{c.footer.privacy}</Link>
          <Link href={`/${locale}/impressum`}>{c.footer.impressum}</Link>
          <Image className="footer-mark footer-mark--large" src="/brand/logo.svg" width={128} height={95} alt="" aria-hidden="true" />
        </section>
      </div>

      <div className="site-footer__bottom">
        © {year} {c.footer.copyright}
      </div>
    </footer>
  );
}
