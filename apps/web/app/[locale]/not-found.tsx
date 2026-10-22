'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {rebuildCopy} from '@/lib/rebuild-copy';
const messages={en:['Page not found','This page is unavailable or has moved.'],de:['Seite nicht gefunden','Diese Seite ist nicht verfügbar oder wurde verschoben.'],uk:['Сторінку не знайдено','Ця сторінка недоступна або її переміщено.'],ru:['Страница не найдена','Эта страница недоступна или была перемещена.'],sk:['Stránka sa nenašla','Táto stránka nie je dostupná alebo bola presunutá.'],fr:['Page introuvable','Cette page est indisponible ou a été déplacée.']};
export default function NotFound(){const value=usePathname().split('/')[1];const locale=value in messages?value:'en';const text=messages[locale as keyof typeof messages],copy=rebuildCopy(locale);return <Shell locale={locale}><section className="section rebuild-narrow"><span className="eyebrow">TiLADYS · 404</span><h1>{text[0]}</h1><p>{text[1]}</p><div className="actions"><Link className="primary" href={`/${locale}`}>TiLADYS</Link><Link className="secondary" href={`/${locale}/portfolio`}>{copy.projects}</Link><Link className="secondary" href={`/${locale}/contact`}>{copy.contact}</Link></div></section></Shell>;}
