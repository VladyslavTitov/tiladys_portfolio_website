import { LegalPlaceholder } from '@/components/LegalPlaceholder';
import { t } from '@/lib/i18n';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPlaceholder locale={locale} title={t(locale).footer.terms} />;
}
