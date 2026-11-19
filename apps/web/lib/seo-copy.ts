import { type Locale } from '@tiladys/shared';

type PublicPage = 'home' | 'portfolio' | 'prices' | 'about' | 'contact';
type SeoCopy = Record<PublicPage, { title: string; description: string }>;

const seo: Record<Locale, SeoCopy> = {
  de: {
    home: { title: 'PC-Service, IT-Hilfe & Webdesign in Mülheim', description: 'TiLADYS bietet PC- und Laptop-Service, Reinigung, Aufrüstung und moderne Websites in Mülheim an der Ruhr, Essen, Duisburg und Umgebung.' },
    portfolio: { title: 'Referenzen & IT-Projekte', description: 'Entdecken Sie echte TiLADYS Projekte: PC-Service, Hardware-Upgrades, IT-Lösungen und moderne Websites für Unternehmen.' },
    prices: { title: 'Preise für PC-Service & Webdesign', description: 'Entdecken Sie die Leistungen und Preise von TiLADYS für PC- und Laptop-Hilfe, IT-Support und Website-Erstellung. Anfrage in Mülheim und Umgebung.' },
    about: { title: 'Über TiLADYS – Persönlicher IT-Service', description: 'Lernen Sie TiLADYS kennen: persönliche IT-Hilfe, PC-Service und Webdesign für Privatpersonen und kleine Unternehmen in Nordrhein-Westfalen.' },
    contact: { title: 'Kontakt – PC-Hilfe & Webdesign anfragen', description: 'Kontaktieren Sie TiLADYS für PC-Reparatur, Laptop-Service, IT-Hilfe oder eine neue Website in Mülheim an der Ruhr und Umgebung.' },
  },
  en: {
    home: { title: 'PC Support, IT Help & Web Design in Mülheim', description: 'TiLADYS offers PC and laptop support, cleaning, upgrades and modern websites in Mülheim an der Ruhr, Essen, Duisburg and nearby areas.' },
    portfolio: { title: 'Portfolio – IT & Website Projects', description: 'Explore real TiLADYS projects including PC maintenance, hardware upgrades, practical IT solutions and business websites.' },
    prices: { title: 'PC Support & Web Design Prices', description: 'Explore TiLADYS services and pricing for PC and laptop assistance, IT support and website development in the Mülheim area.' },
    about: { title: 'About TiLADYS – Personal IT Support', description: 'Learn about TiLADYS and our practical PC support, IT assistance and website services for individuals and small businesses.' },
    contact: { title: 'Contact TiLADYS – Get IT Help', description: 'Contact TiLADYS for PC and laptop assistance, IT support or website development in Mülheim an der Ruhr and surrounding cities.' },
  },
  uk: {
    home: { title: 'Допомога з ПК, IT-послуги та сайти в Мюльгаймі', description: 'TiLADYS: допомога з ПК і ноутбуками, чищення, модернізація та створення сайтів у Мюльгаймі-на-Рурі й сусідніх містах.' },
    portfolio: { title: 'Портфоліо – IT-проєкти та вебсайти', description: 'Реальні проєкти TiLADYS: обслуговування комп’ютерів, оновлення комплектуючих, IT-рішення та вебсайти для бізнесу.' },
    prices: { title: 'Ціни на IT-послуги та створення сайтів', description: 'Перегляньте послуги та ціни TiLADYS на допомогу з ПК, ноутбуками, IT-підтримку й розробку вебсайтів.' },
    about: { title: 'Про TiLADYS – Персональна IT-допомога', description: 'Дізнайтеся більше про TiLADYS: практична комп’ютерна допомога, IT-послуги та створення сайтів у Німеччині.' },
    contact: { title: 'Контакти TiLADYS – Звернутися по допомогу', description: 'Зв’яжіться з TiLADYS для допомоги з комп’ютерами, ноутбуками, IT-питаннями або створенням вебсайту.' },
  },
  ru: {
    home: { title: 'Помощь с ПК, IT-услуги и сайты в Мюльхайме', description: 'TiLADYS: обслуживание ПК и ноутбуков, чистка, модернизация и создание сайтов в Мюльхайме-на-Руре и соседних городах.' },
    portfolio: { title: 'Портфолио – IT-проекты и сайты', description: 'Реальные проекты TiLADYS: обслуживание компьютеров, обновление комплектующих, IT-решения и сайты для бизнеса.' },
    prices: { title: 'Цены на компьютерную помощь и создание сайтов', description: 'Узнайте об услугах и ценах TiLADYS на помощь с ПК и ноутбуками, IT-поддержку и разработку сайтов.' },
    about: { title: 'О TiLADYS – Персональная IT-поддержка', description: 'Познакомьтесь с TiLADYS: практическая компьютерная помощь, IT-услуги и создание сайтов в Германии.' },
    contact: { title: 'Контакты TiLADYS – Обратиться за помощью', description: 'Свяжитесь с TiLADYS по вопросам обслуживания компьютеров, ноутбуков, IT-поддержки или создания сайта.' },
  },
  sk: {
    home: { title: 'Servis PC, IT pomoc a webstránky v Mülheime', description: 'TiLADYS poskytuje servis PC a notebookov, čistenie, modernizáciu a tvorbu webstránok v Mülheim an der Ruhr a okolí.' },
    portfolio: { title: 'Portfólio – IT projekty a webstránky', description: 'Pozrite si reálne projekty TiLADYS: servis počítačov, výmeny komponentov, IT riešenia a firemné webstránky.' },
    prices: { title: 'Ceny IT služieb a tvorby webstránok', description: 'Preskúmajte služby a ceny TiLADYS za pomoc s počítačmi, notebookmi, IT podporu a tvorbu webstránok.' },
    about: { title: 'O TiLADYS – Osobná IT pomoc', description: 'Spoznajte TiLADYS: praktický servis počítačov, IT pomoc a tvorba webstránok pre jednotlivcov a malé firmy.' },
    contact: { title: 'Kontakt TiLADYS – Požiadajte o IT pomoc', description: 'Kontaktujte TiLADYS pri problémoch s PC, notebookom, IT službami alebo pri tvorbe webstránky.' },
  },
  fr: {
    home: { title: 'Dépannage PC, assistance IT et sites web à Mülheim', description: 'TiLADYS propose assistance PC et portable, nettoyage, mises à niveau et création de sites web à Mülheim an der Ruhr et alentours.' },
    portfolio: { title: 'Portfolio – Projets informatiques et web', description: 'Découvrez les projets réels de TiLADYS : entretien PC, améliorations matérielles, solutions informatiques et sites professionnels.' },
    prices: { title: 'Tarifs – Assistance informatique et sites web', description: 'Consultez les services et tarifs TiLADYS pour ordinateurs, assistance informatique et création de sites web.' },
    about: { title: 'À propos de TiLADYS – Assistance informatique', description: 'Découvrez TiLADYS : assistance informatique personnalisée, entretien des PC et création de sites web en Allemagne.' },
    contact: { title: 'Contacter TiLADYS – Assistance PC et web', description: 'Contactez TiLADYS pour vos problèmes de PC, d’ordinateur portable, vos besoins informatiques ou votre futur site web.' },
  },
};

export function pageSeo(locale: string, page: PublicPage) {
  return (seo[locale as Locale] ?? seo.en)[page];
}
