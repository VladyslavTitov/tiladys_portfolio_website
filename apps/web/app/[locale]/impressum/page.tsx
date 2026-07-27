import { LegalPlaceholder } from '@/components/LegalPlaceholder';
import { t } from '@/lib/i18n';

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPlaceholder locale={locale} title={t(locale).footer.impressum} />;
}
