import type { Locale } from '@tiladys/shared';

const categoryCopy: Record<Locale, Record<string, string>> = {
  en: { 'web-development': 'Web Development', 'pc-support': 'PC Support', design: 'Design', 'linux-servers': 'Linux & Servers', 'google-business': 'Google Business', 'digital-support': 'Digital Support', 'data-protection': 'Backup & Data Protection', other: 'Other' },
  de: { 'web-development': 'Webentwicklung', 'pc-support': 'PC-Support', design: 'Design', 'linux-servers': 'Linux & Server', 'google-business': 'Google Business', 'digital-support': 'Digitale Unterstützung', 'data-protection': 'Backup & Datenschutz', other: 'Sonstiges' },
  uk: { 'web-development': 'Веброзробка', 'pc-support': 'Підтримка ПК', design: 'Дизайн', 'linux-servers': 'Linux і сервери', 'google-business': 'Google Business', 'digital-support': 'Цифрова підтримка', 'data-protection': 'Резервні копії та захист даних', other: 'Інше' },
  ru: { 'web-development': 'Веб-разработка', 'pc-support': 'Поддержка ПК', design: 'Дизайн', 'linux-servers': 'Linux и серверы', 'google-business': 'Google Business', 'digital-support': 'Цифровая поддержка', 'data-protection': 'Резервные копии и защита данных', other: 'Другое' },
  sk: { 'web-development': 'Vývoj webu', 'pc-support': 'Podpora PC', design: 'Dizajn', 'linux-servers': 'Linux a servery', 'google-business': 'Google Business', 'digital-support': 'Digitálna podpora', 'data-protection': 'Zálohovanie a ochrana údajov', other: 'Iné' },
  fr: { 'web-development': 'Développement web', 'pc-support': 'Assistance PC', design: 'Design', 'linux-servers': 'Linux et serveurs', 'google-business': 'Google Business', 'digital-support': 'Assistance numérique', 'data-protection': 'Sauvegarde et protection des données', other: 'Autre' },
};

const availabilityCopy: Record<Locale, string> = {
  en: 'Available', de: 'Verfügbar', uk: 'Доступно', ru: 'Доступно', sk: 'Dostupné', fr: 'Disponible',
};

export function projectCategoryLabel(category: string, locale: string): string {
  const selected = categoryCopy[locale as Locale] ?? categoryCopy.en;
  return selected[category] ?? category.replaceAll('-', ' ');
}

export function projectLinksAvailable(locale: string): string {
  return availabilityCopy[locale as Locale] ?? availabilityCopy.en;
}
