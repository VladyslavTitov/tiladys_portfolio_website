import { locales, type Locale } from '@tiladys/shared';
import { notFound } from 'next/navigation';
import { siteUrl } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${siteUrl}/#business`,
  name: 'TiLADYS',
  url: siteUrl,
  telephone: '+49 163 7235608',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mülheim an der Ruhr',
    addressRegion: 'Nordrhein-Westfalen',
    addressCountry: 'DE',
  },
  areaServed: ['Mülheim an der Ruhr', 'Essen', 'Duisburg', 'Oberhausen', 'Düsseldorf', 'Ratingen'].map((name) => ({ '@type': 'City', name })),
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:30' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '15:00' },
  ],
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
    {children}
  </>;
}
