'use client';
import {usePathname} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {portfolioStateCopy} from '@/lib/portfolio-state';
export default function PageError({reset}:{reset:()=>void}){const raw=usePathname().split('/')[1];const locale=['en','de','uk','ru','sk','fr'].includes(raw)?raw:'en';const copy=portfolioStateCopy(locale);return <Shell locale={locale}><section className="section rebuild-narrow" role="alert"><h1>{copy.title}</h1><p>{copy.text}</p><button className="primary" onClick={reset}>{copy.retry}</button></section></Shell>;}
