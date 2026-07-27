import type { Locale } from '@tiladys/shared';

type HomePageExtra = {
  eyebrow: string;
  viewServices: string;
  trust: [string, string, string];
  projectsKicker: string;
  projectCategories: [string, string, string, string];
  projectPlaceholder: string;
  seeAllPortfolio: string;
  heroAlt: string;
};

const copy: Record<Locale, HomePageExtra> = {
  en: {
    eyebrow: 'PRACTICAL IT SOLUTIONS FOR NRW',
    viewServices: 'View Services',
    trust: ['Trusted support in NRW', 'Clear & fair prices', 'Long-term solutions'],
    projectsKicker: 'OUR PROJECTS',
    projectCategories: ['Web Development', 'PC Build / Clean / Upgrade', 'Design', 'Linux & Server'],
    projectPlaceholder: 'A portfolio case prepared for detailed project content.',
    seeAllPortfolio: 'See All Portfolio',
    heroAlt: 'TiLADYS IT services workspace',
  },
  de: {
    eyebrow: 'PRAKTISCHE IT-LÖSUNGEN FÜR NRW',
    viewServices: 'Leistungen ansehen',
    trust: ['Zuverlässiger Support in NRW', 'Klare & faire Preise', 'Langfristige Lösungen'],
    projectsKicker: 'UNSERE PROJEKTE',
    projectCategories: ['Webentwicklung', 'PC-Bau / Reinigung / Upgrade', 'Design', 'Linux & Server'],
    projectPlaceholder: 'Ein Portfolio-Beispiel, das für ausführliche Projektinhalte vorbereitet ist.',
    seeAllPortfolio: 'Gesamtes Portfolio ansehen',
    heroAlt: 'TiLADYS Arbeitsplatz für IT-Dienstleistungen',
  },
  uk: {
    eyebrow: 'ПРАКТИЧНІ IT-РІШЕННЯ ДЛЯ NRW',
    viewServices: 'Переглянути послуги',
    trust: ['Надійна підтримка в NRW', 'Зрозумілі та чесні ціни', 'Довгострокові рішення'],
    projectsKicker: 'НАШІ ПРОЄКТИ',
    projectCategories: ['Веброзробка', 'Збірка / чищення / модернізація ПК', 'Дизайн', 'Linux і сервери'],
    projectPlaceholder: 'Приклад портфоліо, підготовлений для детального опису проєкту.',
    seeAllPortfolio: 'Переглянути все портфоліо',
    heroAlt: 'Робоче місце IT-сервісу TiLADYS',
  },
  ru: {
    eyebrow: 'ПРАКТИЧНЫЕ IT-РЕШЕНИЯ ДЛЯ NRW',
    viewServices: 'Посмотреть услуги',
    trust: ['Надёжная поддержка в NRW', 'Понятные и честные цены', 'Долгосрочные решения'],
    projectsKicker: 'НАШИ ПРОЕКТЫ',
    projectCategories: ['Веб-разработка', 'Сборка / чистка / апгрейд ПК', 'Дизайн', 'Linux и серверы'],
    projectPlaceholder: 'Пример портфолио, подготовленный для подробного описания проекта.',
    seeAllPortfolio: 'Посмотреть всё портфолио',
    heroAlt: 'Рабочее место IT-сервиса TiLADYS',
  },
  sk: {
    eyebrow: 'PRAKTICKÉ IT RIEŠENIA PRE NRW',
    viewServices: 'Zobraziť služby',
    trust: ['Spoľahlivá podpora v NRW', 'Jasné a férové ceny', 'Dlhodobé riešenia'],
    projectsKicker: 'NAŠE PROJEKTY',
    projectCategories: ['Vývoj webu', 'Zostava / čistenie / upgrade PC', 'Dizajn', 'Linux a servery'],
    projectPlaceholder: 'Ukážka portfólia pripravená na podrobný obsah projektu.',
    seeAllPortfolio: 'Zobraziť celé portfólio',
    heroAlt: 'Pracovisko IT služieb TiLADYS',
  },
  fr: {
    eyebrow: 'SOLUTIONS INFORMATIQUES PRATIQUES POUR LA NRW',
    viewServices: 'Voir les services',
    trust: ['Assistance fiable en NRW', 'Tarifs clairs et équitables', 'Solutions durables'],
    projectsKicker: 'NOS PROJETS',
    projectCategories: ['Développement web', 'Montage / nettoyage / mise à niveau PC', 'Design', 'Linux et serveurs'],
    projectPlaceholder: 'Un exemple de portfolio prêt à accueillir une présentation détaillée du projet.',
    seeAllPortfolio: 'Voir tout le portfolio',
    heroAlt: 'Espace de travail des services informatiques TiLADYS',
  },
};

export function homePageCopy(locale: string): HomePageExtra {
  return copy[locale as Locale] ?? copy.en;
}
