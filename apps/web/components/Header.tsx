'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Headphones, Menu, X } from 'lucide-react';
import { t } from '@/lib/i18n';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'fr', label: 'Français' },
] as const;

const routeNames = ['', 'portfolio', 'about', 'prices', 'contact'] as const;

export function Header({ locale }: { locale: string }) {
  const c = t(locale);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setLanguageOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!languageRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setLanguageOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function localeHref(nextLocale: string) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length && languages.some((item) => item.code === segments[0])) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    return `/${segments.join('/')}`;
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href={`/${locale}`} className="site-brand" aria-label="TiLADYS home">
          <Image src="/brand/icon.svg" width={445} height={106} alt="TiLADYS" priority />
        </Link>

        <nav
          id="primary-navigation"
          className={`site-nav${menuOpen ? ' is-open' : ''}`}
          aria-label={c.header.navigation}
        >
          <div className="site-nav__links">
            {c.nav.map((name: string, index: number) => {
              const suffix = routeNames[index];
              const href = suffix ? `/${locale}/${suffix}` : `/${locale}`;
              return (
                <Link key={name} href={href} className="site-nav__link">
                  {name}
                </Link>
              );
            })}
          </div>

          <div className="site-nav__actions">
            <Link className="header-help" href={`/${locale}/contact`}>
              <Headphones aria-hidden="true" size={19} />
              <span>{c.header.getHelp}</span>
            </Link>

            <div className="language-menu" ref={languageRef}>
              <button
                type="button"
                className="language-menu__trigger"
                aria-label={c.header.language}
                aria-haspopup="menu"
                aria-expanded={languageOpen}
                onClick={() => setLanguageOpen((current) => !current)}
              >
                <span>{locale.toUpperCase()}</span>
                <ChevronDown aria-hidden="true" size={16} />
              </button>

              {languageOpen && (
                <div className="language-menu__list" role="menu">
                  {languages.map((language) => (
                    <Link
                      key={language.code}
                      href={localeHref(language.code)}
                      className={language.code === locale ? 'is-active' : undefined}
                      role="menuitem"
                    >
                      <span>{language.label}</span>
                      <small>{language.code.toUpperCase()}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={menuOpen ? c.header.closeMenu : c.header.openMenu}
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
