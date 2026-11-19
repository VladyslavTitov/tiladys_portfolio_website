import { LegalPage, legalCopy } from '@/components/LegalPage';
import { t } from '@/lib/i18n';
import { localizedMetadata, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = legalCopy(locale);
  return { ...localizedMetadata({ locale, pathname: 'terms', title: t(locale).footer.terms, description: copy.process }), alternates: { canonical: `${siteUrl}/${locale}/terms` }, robots: { index: false, follow: true } };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage kind="terms" locale={locale} title={t(locale).footer.terms} />;
}
