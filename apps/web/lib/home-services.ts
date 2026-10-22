import type { Locale } from '@tiladys/shared';
import type { ServiceId } from './services';

type HomeService = { id: ServiceId; title: string; description: string; items: string[]; cta: string };
type HomeContact = { title: string; text: string; cta: string };

const cards: Record<Locale, { services: HomeService[]; contact: HomeContact }> = {
  en: { services: [
    { id: 'pc-laptop', title: 'PC & Laptop Services', description: 'Setup, troubleshooting, cleaning, upgrades, PC building and data help.', items: ['Setup & troubleshooting', 'Cleaning & optimization', 'Hardware upgrades', 'Data transfer & backup'], cta: 'Learn more' },
    { id: 'websites', title: 'Website Creation', description: 'Modern websites built for businesses, services and local customers.', items: ['One-page & business websites', 'Landing pages', 'Hosting & SSL', 'Updates & support'], cta: 'Learn more' },
    { id: 'business-it', title: 'Business IT & Digital Services', description: 'Practical digital support for self-employed professionals and small businesses.', items: ['Email & cloud', 'Wi-Fi & networks', 'Google Business', 'Photos & business design'], cta: 'Learn more' },
  ], contact: { title: "Can't find what you need?", text: 'Tell us what you need help with. TiLADYS may still be able to find the right solution.', cta: 'Contact TiLADYS' } },
  de: { services: [
    { id: 'pc-laptop', title: 'PC- & Laptop-Service', description: 'Einrichtung, Fehlerbehebung, Reinigung, Upgrades, PC-Zusammenbau und Datenhilfe.', items: ['Einrichtung & Fehlerbehebung', 'Reinigung & Optimierung', 'Hardware-Upgrades', 'Datenübertragung & Backup'], cta: 'Mehr erfahren' },
    { id: 'websites', title: 'Website-Erstellung', description: 'Moderne Websites für Unternehmen, Dienstleister und lokale Kunden.', items: ['Onepage- & Unternehmenswebsites', 'Landingpages', 'Hosting & SSL', 'Updates & Support'], cta: 'Mehr erfahren' },
    { id: 'business-it', title: 'Business-IT & digitale Services', description: 'Praktische digitale Unterstützung für Selbstständige und kleine Unternehmen.', items: ['E-Mail & Cloud', 'WLAN & Netzwerke', 'Google Business', 'Fotos & Business-Design'], cta: 'Mehr erfahren' },
  ], contact: { title: 'Nicht das Richtige gefunden?', text: 'Beschreiben Sie, wobei Sie Hilfe benötigen. TiLADYS findet möglicherweise trotzdem die passende Lösung.', cta: 'TiLADYS kontaktieren' } },
  uk: { services: [
    { id: 'pc-laptop', title: 'Послуги для ПК і ноутбуків', description: 'Налаштування, діагностика, чищення, модернізація, складання ПК і допомога з даними.', items: ['Налаштування й діагностика', 'Чищення й оптимізація', 'Модернізація обладнання', 'Перенесення даних і копії'], cta: 'Докладніше' },
    { id: 'websites', title: 'Створення сайтів', description: 'Сучасні сайти для компаній, послуг і локальних клієнтів.', items: ['Односторінкові й бізнес-сайти', 'Лендінги', 'Хостинг і SSL', 'Оновлення й підтримка'], cta: 'Докладніше' },
    { id: 'business-it', title: 'IT і цифрові послуги для бізнесу', description: 'Практична цифрова підтримка для самозайнятих і малого бізнесу.', items: ['Пошта й хмара', 'Wi-Fi і мережі', 'Google Business', 'Фото й бізнес-дизайн'], cta: 'Докладніше' },
  ], contact: { title: 'Не знайшли потрібну послугу?', text: 'Опишіть, із чим потрібна допомога. TiLADYS спробує знайти відповідне рішення.', cta: 'Зв’язатися з TiLADYS' } },
  ru: { services: [
    { id: 'pc-laptop', title: 'Услуги для ПК и ноутбуков', description: 'Настройка, диагностика, чистка, модернизация, сборка ПК и помощь с данными.', items: ['Настройка и диагностика', 'Чистка и оптимизация', 'Апгрейды оборудования', 'Перенос данных и копии'], cta: 'Подробнее' },
    { id: 'websites', title: 'Создание сайтов', description: 'Современные сайты для компаний, услуг и локальных клиентов.', items: ['Одностраничные и бизнес-сайты', 'Лендинги', 'Хостинг и SSL', 'Обновления и поддержка'], cta: 'Подробнее' },
    { id: 'business-it', title: 'IT и цифровые услуги для бизнеса', description: 'Практичная цифровая поддержка для самозанятых и малого бизнеса.', items: ['Почта и облако', 'Wi-Fi и сети', 'Google Business', 'Фото и бизнес-дизайн'], cta: 'Подробнее' },
  ], contact: { title: 'Не нашли нужную услугу?', text: 'Опишите, с чем нужна помощь. TiLADYS постарается найти подходящее решение.', cta: 'Связаться с TiLADYS' } },
  sk: { services: [
    { id: 'pc-laptop', title: 'Služby pre PC a notebooky', description: 'Nastavenie, diagnostika, čistenie, vylepšenia, skladanie PC a pomoc s dátami.', items: ['Nastavenie a diagnostika', 'Čistenie a optimalizácia', 'Hardvérové vylepšenia', 'Prenos dát a zálohy'], cta: 'Viac informácií' },
    { id: 'websites', title: 'Tvorba webových stránok', description: 'Moderné weby pre firmy, služby a miestnych zákazníkov.', items: ['Jednostránkové a firemné weby', 'Landing pages', 'Hosting a SSL', 'Aktualizácie a podpora'], cta: 'Viac informácií' },
    { id: 'business-it', title: 'Firemné IT a digitálne služby', description: 'Praktická digitálna podpora pre živnostníkov a malé firmy.', items: ['E-mail a cloud', 'Wi-Fi a siete', 'Google Business', 'Fotografie a firemný dizajn'], cta: 'Viac informácií' },
  ], contact: { title: 'Nenašli ste, čo potrebujete?', text: 'Opíšte, s čím potrebujete pomôcť. TiLADYS sa pokúsi nájsť vhodné riešenie.', cta: 'Kontaktovať TiLADYS' } },
  fr: { services: [
    { id: 'pc-laptop', title: 'Services PC et ordinateur portable', description: 'Configuration, diagnostic, nettoyage, mises à niveau, assemblage PC et aide aux données.', items: ['Configuration et diagnostic', 'Nettoyage et optimisation', 'Mises à niveau matérielles', 'Transfert et sauvegarde'], cta: 'En savoir plus' },
    { id: 'websites', title: 'Création de sites web', description: 'Sites modernes conçus pour entreprises, services et clientèle locale.', items: ['Sites one-page et professionnels', 'Pages d’atterrissage', 'Hébergement et SSL', 'Mises à jour et assistance'], cta: 'En savoir plus' },
    { id: 'business-it', title: 'IT et services numériques pour entreprises', description: 'Assistance numérique pratique pour indépendants et petites entreprises.', items: ['E-mail et cloud', 'Wi-Fi et réseaux', 'Google Business', 'Photos et design professionnel'], cta: 'En savoir plus' },
  ], contact: { title: 'Vous ne trouvez pas votre besoin ?', text: 'Décrivez l’aide recherchée. TiLADYS pourra peut-être trouver la solution adaptée.', cta: 'Contacter TiLADYS' } },
};

export function homeServices(locale: string) { return cards[locale as Locale] ?? cards.en; }
