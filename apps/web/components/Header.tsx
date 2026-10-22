'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronDown, Headphones, Menu, X } from 'lucide-react';
import { rebuildCopy } from '@/lib/rebuild-copy';
import { t } from '@/lib/i18n';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'fr', label: 'Français' },
] as const;

const routeNames = ['services/websites', 'services/3d-printing', 'services/pc-laptop', 'portfolio', 'about', 'contact'] as const;

export function Header({ locale,availableLocales,fallbackPath='portfolio' }: { locale: string;availableLocales?:string[];fallbackPath?:string }) {
  const c = t(locale);
  const brandCopy = rebuildCopy(locale);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const queryString=useSyncExternalStore(subscribeLocation,()=>window.location.search+window.location.hash,()=> '');
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);

  // The root layout supplies the initial language; client route transitions
  // retain that layout, so keep assistive technology in sync with visible copy.
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!languageRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if(menuButtonRef.current?.getAttribute('aria-expanded')==='true'||languageRef.current?.querySelector('[role=menu]'))event.preventDefault();
        if(languageRef.current?.contains(document.activeElement))languageRef.current.querySelector('button')?.focus();
        setLanguageOpen(false);
        if (menuOpen) menuButtonRef.current?.focus();
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(()=>{
    if(!menuOpen||!window.matchMedia('(max-width:1199px)').matches)return;
    const button=menuButtonRef.current;const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const navigation=document.getElementById('primary-navigation');
    const focusable=()=>[...(navigation?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[]),menuButtonRef.current].filter((el):el is HTMLElement=>Boolean(el));
    const frame=requestAnimationFrame(()=>focusable()[0]?.focus());
    const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const elements=focusable();const index=elements.indexOf(document.activeElement as HTMLElement);if(e.shiftKey&&index<=0){e.preventDefault();elements.at(-1)?.focus();}else if(!e.shiftKey&&(index<0||index===elements.length-1)){e.preventDefault();elements[0]?.focus();}};
    document.addEventListener('keydown',trap);
    return()=>{cancelAnimationFrame(frame);document.body.style.overflow=previous;document.removeEventListener('keydown',trap);button?.focus();};
  },[menuOpen]);

  function localeHref(nextLocale: string) {
    if(availableLocales&&!availableLocales.includes(nextLocale))return `/${nextLocale}/${fallbackPath}${queryString}`;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length && languages.some((item) => item.code === segments[0])) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    return `/${segments.join('/')}${queryString}`;
  }

  return (
    <header className="site-header"><a className="skip-link" href="#main-content">{locale==='de'?'Zum Inhalt':'Skip to content'}</a>
      <div className="site-header__inner">
        <Link href={`/${locale}`} className="site-brand" aria-label="TiLADYS home" onClick={() => { setMenuOpen(false); setLanguageOpen(false); }}>
          <Image src="/brand/icon.svg" width={445} height={106} alt="TiLADYS" />
        </Link>

        <nav
          id="primary-navigation"
          className={`site-nav${menuOpen ? ' is-open' : ''}`}
          aria-label={c.header.navigation}
        >
          <div className="site-nav__links">
            {[brandCopy.websites, brandCopy.printing, brandCopy.pc, c.nav[2], c.nav[3], c.nav[4]].map((name: string, index: number) => {
              const suffix = routeNames[index];
              const href = suffix ? `/${locale}/${suffix}` : `/${locale}`;
              return (
                <Link key={name} href={href} className="site-nav__link" aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                  {name}
                </Link>
              );
            })}
          </div>

          <div className="site-nav__actions">
            <Link className="header-help" href={`/${locale}/contact`} onClick={() => setMenuOpen(false)}>
              <Headphones aria-hidden="true" size={19} />
              <span>{brandCopy.start}</span>
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
                <div className="language-menu__list" role="menu" onKeyDown={e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const items=[...e.currentTarget.querySelectorAll<HTMLAnchorElement>('a')],index=items.indexOf(document.activeElement as HTMLAnchorElement);const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}}>
                  {languages.map((language) => (
                    <Link
                      key={language.code}
                      href={localeHref(language.code)}
                      className={language.code === locale ? 'is-active' : undefined}
                      role="menuitem"
                      onClick={() => { setLanguageOpen(false); setMenuOpen(false); }}
                    >
                      <span>{language.label}</span>
                      <small>{language.code.toUpperCase()}{availableLocales&&!availableLocales.includes(language.code)?' · '+(fallbackPath.startsWith('products')?brandCopy.browse:brandCopy.projects):''}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <button
          type="button"
          ref={menuButtonRef}
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

function subscribeLocation(callback:()=>void){window.addEventListener('popstate',callback);window.addEventListener('hashchange',callback);return()=>{window.removeEventListener('popstate',callback);window.removeEventListener('hashchange',callback);};}
