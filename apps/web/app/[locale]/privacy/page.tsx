import { LegalPlaceholder } from '@/components/LegalPlaceholder';
import { t } from '@/lib/i18n';
import { p } from '@/lib/page-copy';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return localizedMetadata({ locale, pathname: 'privacy', title: t(locale).footer.privacy, description: p(locale).legal.subtitle });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPlaceholder locale={locale} title={t(locale).footer.privacy} />;
}
