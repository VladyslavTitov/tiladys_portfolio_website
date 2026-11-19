import type { Metadata } from 'next';
import { locales } from '@tiladys/shared';

// Every public language page has its own canonical; translations are alternates,
// never canonicalized to a single language or to the homepage.
export const siteUrl = 'https://tiladys.com';
export function localizedAlternates(locale: string, suffix = ''): Metadata['alternates'] {
  const path = suffix ? `/${suffix.replace(/^\\/+/, '')}` : '';
  const languages: Record<string, string> = {};
  for (const language of locales) languages[language] = `/${language}${path}`;
  languages['x-default'] = `/en${path}`;
  return { canonical: `/${locale}${path}`, languages };
}
