import { LegalPage, legalCopy } from '@/components/LegalPage';
import { t } from '@/lib/i18n';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { ...localizedMetadata({ locale, pathname: 'privacy', title: t(locale).footer.privacy, description: legalCopy(locale).review }), robots: { index: false, follow: true } };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage kind="privacy" locale={locale} title={t(locale).footer.privacy} />;
}
