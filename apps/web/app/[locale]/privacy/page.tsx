import { LegalPage, legalCopy } from '@/components/LegalPage';
import { t } from '@/lib/i18n';
import { localizedMetadata, siteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = legalCopy(locale);
  return { ...localizedMetadata({ locale, pathname: 'privacy', title: t(locale).footer.privacy, description: copy.privacySections[0][1] }), alternates: { canonical: `${siteUrl}/${locale}/privacy` }, robots: { index: false, follow: true } };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage kind="privacy" locale={locale} title={t(locale).footer.privacy} />;
}
