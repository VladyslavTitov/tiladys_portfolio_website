import { LegalPage } from '@/components/LegalPage';
import { t } from '@/lib/i18n';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { ...localizedMetadata({ locale, pathname: 'terms', title: t(locale).footer.terms, description: t(locale).footer.terms }), robots: { index: false, follow: true } };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage kind="terms" locale={locale} title={t(locale).footer.terms} />;
}
