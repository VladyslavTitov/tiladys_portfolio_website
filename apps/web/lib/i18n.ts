import type { Locale } from '@tiladys/shared';

type ServiceCopy = { title: string; description: string; items: string[] };
type ProcessStepCopy = { title: string; text: string };
export type SiteCopy = {
  nav: [string, string, string, string, string];
  hero: string;
  sub: string;
  services: string;
  projects: string;
  prices: string;
  contact: string;
  about: string;
  send: string;
  header: { getHelp: string; language: string; navigation: string; openMenu: string; closeMenu: string };
  home: {
    servicesKicker: string;
    servicesTitle: string;
    servicesAccent: string;
    servicesIntro: string;
    servicesButton: string;
    services: ServiceCopy[];
    processKicker: string;
    processTitle: string;
    processSteps: ProcessStepCopy[];
    ctaTitle: string;
    ctaText: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  footer: {
    tagline: string;
    contactTitle: string;
    linksTitle: string;
    socialTitle: string;
    legalTitle: string;
    terms: string;
    privacy: string;
    impressum: string;
    copyright: string;
    location: string;
  };
};

export const copy: Record<Locale, SiteCopy> = {
  en: {
    nav: ['Home', 'Portfolio', 'About', 'Prices', 'Contact'],
    hero: 'Simple IT help and websites for home users and small businesses.',
    sub: 'Websites, PC & laptop setup, cleaning, upgrades, Google Business and everyday digital support — clear, reliable and practical.',
    services: 'Services that make IT simple.',
    projects: 'A selection of recent projects.',
    prices: 'Prices & Services',
    contact: 'Contact',
    about: 'About & Qualifications',
    send: 'Send message',
    header: { getHelp: 'Get Help', language: 'Language', navigation: 'Primary navigation', openMenu: 'Open menu', closeMenu: 'Close menu' },
    home: {
      servicesKicker: 'HOW CAN I HELP?',
      servicesTitle: 'Services that make IT',
      servicesAccent: 'simple.',
      servicesIntro: 'Everything you need — in one place.',
      servicesButton: 'See All Services + Prices',
      services: [
        { title: 'Websites', description: 'Modern, fast and mobile-friendly websites that bring results.', items: ['One-page & multi-page', 'Hosting & domain', 'SSL security', 'Updates & support'] },
        { title: 'PC & Laptop Help', description: 'Setup, cleaning, upgrades and troubleshooting — for home and office.', items: ['System setup', 'Cleaning & optimization', 'Upgrades', 'Problem solving'] },
        { title: 'Google Business', description: 'More visibility, a better profile, and more local customers.', items: ['Profile setup', 'Updates & optimization', 'Photos & posts', 'Local visibility'] },
        { title: 'Digital Support', description: 'Email, cloud, backups, VPNs and day-to-day IT help.', items: ['Email & cloud', 'Backups & security', 'VPN setup', 'General IT support'] },
        { title: 'IT for You', description: "Practical help for people who aren't techy but want it.", items: ['Friendly advice', 'Clear solutions', 'No tech jargon', 'Personal support'] }
      ],
      processKicker: 'HOW IT WORKS',
      processTitle: 'A simple process. You know what to expect.',
      processSteps: [
        { title: 'Request', text: 'Tell us what you need.' },
        { title: 'Quick assessment', text: 'We check and suggest the best solutions.' },
        { title: 'Agreement', text: 'Clear scope, time and price.' },
        { title: 'Work done', text: 'We handle it with care and precision.' },
        { title: 'Check & handover', text: 'We test, explain and hand it over.' }
      ],
      ctaTitle: 'Need help with IT or your website?',
      ctaText: "Tell us what you need and we'll suggest a simple solution.",
      ctaPrimary: 'Contact Me',
      ctaSecondary: 'Open Contact Form'
    },
    footer: {
      tagline: 'Practical IT and web solutions for home users and small businesses in NRW.',
      contactTitle: 'Contact',
      linksTitle: 'Links',
      socialTitle: 'Follow / Social',
      legalTitle: 'Legal',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      impressum: 'Impressum',
      copyright: 'TiLADYS — IT Services & Webdesign. All rights reserved.',
      location: 'NRW, Germany'
    }
  },
  de: {
    nav: ['Start', 'Portfolio', 'Über mich', 'Preise', 'Kontakt'],
    hero: 'Einfache IT-Hilfe und Websites für Privatkunden und kleine Unternehmen.',
    sub: 'Websites, PC- und Laptop-Einrichtung, Reinigung, Upgrades, Google Business und digitale Unterstützung in NRW.',
    services: 'IT-Services, einfach erklärt.',
    projects: 'Eine Auswahl aktueller Projekte.',
    prices: 'Preise & Leistungen',
    contact: 'Kontakt',
    about: 'Über mich & Qualifikationen',
    send: 'Nachricht senden',
    header: { getHelp: 'Hilfe erhalten', language: 'Sprache', navigation: 'Hauptnavigation', openMenu: 'Menü öffnen', closeMenu: 'Menü schließen' },
    home: {
      servicesKicker: 'WIE KANN ICH HELFEN?',
      servicesTitle: 'Services, die IT',
      servicesAccent: 'einfach machen.',
      servicesIntro: 'Alles, was Sie brauchen — an einem Ort.',
      servicesButton: 'Alle Services + Preise',
      services: [
        { title: 'Websites', description: 'Moderne, schnelle und mobilfreundliche Websites mit klarem Nutzen.', items: ['One-Page & mehrseitig', 'Hosting & Domain', 'SSL-Sicherheit', 'Updates & Support'] },
        { title: 'PC- & Laptop-Hilfe', description: 'Einrichtung, Reinigung, Upgrades und Fehlerbehebung für Zuhause und Büro.', items: ['Systemeinrichtung', 'Reinigung & Optimierung', 'Upgrades', 'Problemlösung'] },
        { title: 'Google Business', description: 'Mehr Sichtbarkeit, ein besseres Profil und mehr lokale Kunden.', items: ['Profil-Einrichtung', 'Updates & Optimierung', 'Fotos & Beiträge', 'Lokale Sichtbarkeit'] },
        { title: 'Digitale Unterstützung', description: 'E-Mail, Cloud, Backups, VPN und tägliche IT-Hilfe.', items: ['E-Mail & Cloud', 'Backups & Sicherheit', 'VPN-Einrichtung', 'Allgemeiner IT-Support'] },
        { title: 'IT für Sie', description: 'Praktische Hilfe ohne komplizierte Fachbegriffe.', items: ['Freundliche Beratung', 'Klare Lösungen', 'Kein Technikjargon', 'Persönlicher Support'] }
      ],
      processKicker: 'SO FUNKTIONIERT ES',
      processTitle: 'Ein einfacher Ablauf. Sie wissen, was Sie erwartet.',
      processSteps: [
        { title: 'Anfrage', text: 'Beschreiben Sie, was Sie benötigen.' },
        { title: 'Kurze Einschätzung', text: 'Wir prüfen die Aufgabe und empfehlen eine Lösung.' },
        { title: 'Vereinbarung', text: 'Klarer Umfang, Zeit und Preis.' },
        { title: 'Durchführung', text: 'Die Arbeit wird sorgfältig und präzise erledigt.' },
        { title: 'Prüfung & Übergabe', text: 'Wir testen, erklären und übergeben das Ergebnis.' }
      ],
      ctaTitle: 'Benötigen Sie Hilfe mit IT oder Ihrer Website?',
      ctaText: 'Beschreiben Sie Ihre Aufgabe und wir schlagen eine einfache Lösung vor.',
      ctaPrimary: 'Kontakt aufnehmen',
      ctaSecondary: 'Kontaktformular öffnen'
    },
    footer: {
      tagline: 'Praktische IT- und Weblösungen für Privatkunden und kleine Unternehmen in NRW.',
      contactTitle: 'Kontakt', linksTitle: 'Links', socialTitle: 'Folgen / Social', legalTitle: 'Rechtliches',
      terms: 'Nutzungsbedingungen', privacy: 'Datenschutz', impressum: 'Impressum',
      copyright: 'TiLADYS — IT Services & Webdesign. Alle Rechte vorbehalten.', location: 'NRW, Deutschland'
    }
  },
  uk: {
    nav: ['Головна', 'Портфоліо', 'Про мене', 'Ціни', 'Контакти'],
    hero: 'Проста IT-допомога та сайти для приватних клієнтів і малого бізнесу.',
    sub: 'Сайти, налаштування ПК і ноутбуків, чистка, модернізація, Google Business та цифрова підтримка.',
    services: 'Послуги, що роблять IT простішим.',
    projects: 'Добірка останніх проєктів.',
    prices: 'Ціни та послуги', contact: 'Контакти', about: 'Про мене та кваліфікації', send: 'Надіслати',
    header: { getHelp: 'Отримати допомогу', language: 'Мова', navigation: 'Головна навігація', openMenu: 'Відкрити меню', closeMenu: 'Закрити меню' },
    home: {
      servicesKicker: 'ЧИМ Я МОЖУ ДОПОМОГТИ?', servicesTitle: 'Послуги, що роблять IT', servicesAccent: 'простішим.', servicesIntro: 'Усе необхідне — в одному місці.', servicesButton: 'Усі послуги + ціни',
      services: [
        { title: 'Сайти', description: 'Сучасні, швидкі й адаптивні сайти, які допомагають бізнесу.', items: ['Односторінкові й багатосторінкові', 'Хостинг і домен', 'SSL-безпека', 'Оновлення та підтримка'] },
        { title: 'Допомога з ПК і ноутбуками', description: 'Налаштування, чистка, модернізація та усунення проблем.', items: ['Налаштування системи', 'Чистка й оптимізація', 'Модернізація', 'Вирішення проблем'] },
        { title: 'Google Business', description: 'Більше видимості, кращий профіль і більше локальних клієнтів.', items: ['Налаштування профілю', 'Оновлення й оптимізація', 'Фото та публікації', 'Локальна видимість'] },
        { title: 'Цифрова підтримка', description: 'Пошта, хмара, резервні копії, VPN і щоденна IT-допомога.', items: ['Пошта й хмара', 'Резервні копії та безпека', 'Налаштування VPN', 'Загальна IT-підтримка'] },
        { title: 'IT для вас', description: 'Практична допомога без складних технічних слів.', items: ['Доброзичлива порада', 'Зрозумілі рішення', 'Без технічного жаргону', 'Особиста підтримка'] }
      ],
      processKicker: 'ЯК ЦЕ ПРАЦЮЄ', processTitle: 'Простий процес. Ви знаєте, чого очікувати.',
      processSteps: [
        { title: 'Заявка', text: 'Розкажіть, що вам потрібно.' },
        { title: 'Швидка оцінка', text: 'Ми перевіряємо завдання й пропонуємо рішення.' },
        { title: 'Погодження', text: 'Чіткий обсяг, термін і ціна.' },
        { title: 'Виконання', text: 'Робота виконується уважно й точно.' },
        { title: 'Перевірка та передача', text: 'Ми тестуємо, пояснюємо й передаємо результат.' }
      ],
      ctaTitle: 'Потрібна допомога з IT або сайтом?', ctaText: 'Опишіть завдання, і ми запропонуємо просте рішення.', ctaPrimary: 'Зв’язатися', ctaSecondary: 'Відкрити контактну форму'
    },
    footer: { tagline: 'Практичні IT- та вебрішення для домашніх користувачів і малого бізнесу в NRW.', contactTitle: 'Контакти', linksTitle: 'Посилання', socialTitle: 'Соціальні мережі', legalTitle: 'Правова інформація', terms: 'Умови використання', privacy: 'Політика конфіденційності', impressum: 'Impressum', copyright: 'TiLADYS — IT Services & Webdesign. Усі права захищені.', location: 'NRW, Німеччина' }
  },
  ru: {
    nav: ['Главная', 'Портфолио', 'Обо мне', 'Цены', 'Контакты'],
    hero: 'Простая IT-помощь и сайты для частных клиентов и малого бизнеса.',
    sub: 'Сайты, настройка ПК и ноутбуков, чистка, апгрейды, Google Business и цифровая поддержка.',
    services: 'Услуги, которые делают IT проще.', projects: 'Недавние проекты.', prices: 'Цены и услуги', contact: 'Контакты', about: 'Обо мне и квалификации', send: 'Отправить',
    header: { getHelp: 'Получить помощь', language: 'Язык', navigation: 'Основная навигация', openMenu: 'Открыть меню', closeMenu: 'Закрыть меню' },
    home: {
      servicesKicker: 'ЧЕМ Я МОГУ ПОМОЧЬ?', servicesTitle: 'Услуги, которые делают IT', servicesAccent: 'проще.', servicesIntro: 'Всё необходимое — в одном месте.', servicesButton: 'Все услуги + цены',
      services: [
        { title: 'Сайты', description: 'Современные, быстрые и адаптивные сайты, которые помогают бизнесу.', items: ['Одностраничные и многостраничные', 'Хостинг и домен', 'SSL-безопасность', 'Обновления и поддержка'] },
        { title: 'Помощь с ПК и ноутбуками', description: 'Настройка, чистка, модернизация и устранение проблем.', items: ['Настройка системы', 'Чистка и оптимизация', 'Апгрейды', 'Решение проблем'] },
        { title: 'Google Business', description: 'Больше видимости, лучше профиль и больше местных клиентов.', items: ['Настройка профиля', 'Обновления и оптимизация', 'Фото и публикации', 'Локальная видимость'] },
        { title: 'Цифровая поддержка', description: 'Почта, облако, резервные копии, VPN и повседневная IT-помощь.', items: ['Почта и облако', 'Резервные копии и безопасность', 'Настройка VPN', 'Общая IT-поддержка'] },
        { title: 'IT для вас', description: 'Практическая помощь без сложных технических слов.', items: ['Дружелюбный совет', 'Понятные решения', 'Без технического жаргона', 'Личная поддержка'] }
      ],
      processKicker: 'КАК ЭТО РАБОТАЕТ', processTitle: 'Простой процесс. Вы знаете, чего ожидать.',
      processSteps: [
        { title: 'Заявка', text: 'Расскажите, что вам нужно.' },
        { title: 'Быстрая оценка', text: 'Мы проверяем задачу и предлагаем решение.' },
        { title: 'Согласование', text: 'Понятный объём, срок и цена.' },
        { title: 'Выполнение', text: 'Работа выполняется внимательно и точно.' },
        { title: 'Проверка и передача', text: 'Мы тестируем, объясняем и передаём результат.' }
      ],
      ctaTitle: 'Нужна помощь с IT или сайтом?', ctaText: 'Опишите задачу, и мы предложим простое решение.', ctaPrimary: 'Связаться', ctaSecondary: 'Открыть контактную форму'
    },
    footer: { tagline: 'Практичные IT- и веб-решения для домашних пользователей и малого бизнеса в NRW.', contactTitle: 'Контакты', linksTitle: 'Ссылки', socialTitle: 'Социальные сети', legalTitle: 'Правовая информация', terms: 'Условия использования', privacy: 'Политика конфиденциальности', impressum: 'Impressum', copyright: 'TiLADYS — IT Services & Webdesign. Все права защищены.', location: 'NRW, Германия' }
  },
  sk: {
    nav: ['Domov', 'Portfólio', 'O mne', 'Ceny', 'Kontakt'],
    hero: 'Jednoduchá IT pomoc a webstránky pre domácnosti a malé firmy.',
    sub: 'Webstránky, nastavenie PC a notebookov, čistenie, vylepšenia, Google Business a digitálna podpora.',
    services: 'Služby, ktoré zjednodušujú IT.', projects: 'Výber posledných projektov.', prices: 'Ceny a služby', contact: 'Kontakt', about: 'O mne a kvalifikácie', send: 'Odoslať',
    header: { getHelp: 'Získať pomoc', language: 'Jazyk', navigation: 'Hlavná navigácia', openMenu: 'Otvoriť menu', closeMenu: 'Zavrieť menu' },
    home: {
      servicesKicker: 'AKO MÔŽEM POMÔCŤ?', servicesTitle: 'Služby, ktoré robia IT', servicesAccent: 'jednoduchším.', servicesIntro: 'Všetko, čo potrebujete — na jednom mieste.', servicesButton: 'Všetky služby + ceny',
      services: [
        { title: 'Webstránky', description: 'Moderné, rýchle a responzívne webstránky, ktoré prinášajú výsledky.', items: ['Jednostránkové a viacstránkové', 'Hosting a doména', 'SSL bezpečnosť', 'Aktualizácie a podpora'] },
        { title: 'Pomoc s PC a notebookmi', description: 'Nastavenie, čistenie, vylepšenia a riešenie problémov.', items: ['Nastavenie systému', 'Čistenie a optimalizácia', 'Vylepšenia', 'Riešenie problémov'] },
        { title: 'Google Business', description: 'Lepšia viditeľnosť, kvalitnejší profil a viac miestnych zákazníkov.', items: ['Nastavenie profilu', 'Aktualizácie a optimalizácia', 'Fotografie a príspevky', 'Miestna viditeľnosť'] },
        { title: 'Digitálna podpora', description: 'E-mail, cloud, zálohy, VPN a každodenná IT pomoc.', items: ['E-mail a cloud', 'Zálohy a bezpečnosť', 'Nastavenie VPN', 'Všeobecná IT podpora'] },
        { title: 'IT pre vás', description: 'Praktická pomoc bez zložitého technického jazyka.', items: ['Priateľská rada', 'Jasné riešenia', 'Bez technického žargónu', 'Osobná podpora'] }
      ],
      processKicker: 'AKO TO FUNGUJE', processTitle: 'Jednoduchý proces. Viete, čo môžete očakávať.',
      processSteps: [
        { title: 'Požiadavka', text: 'Povedzte nám, čo potrebujete.' },
        { title: 'Rýchle posúdenie', text: 'Úlohu skontrolujeme a navrhneme riešenie.' },
        { title: 'Dohoda', text: 'Jasný rozsah, čas a cena.' },
        { title: 'Realizácia', text: 'Prácu vykonáme starostlivo a presne.' },
        { title: 'Kontrola a odovzdanie', text: 'Výsledok otestujeme, vysvetlíme a odovzdáme.' }
      ],
      ctaTitle: 'Potrebujete pomoc s IT alebo webstránkou?', ctaText: 'Opíšte úlohu a navrhneme jednoduché riešenie.', ctaPrimary: 'Kontaktovať', ctaSecondary: 'Otvoriť kontaktný formulár'
    },
    footer: { tagline: 'Praktické IT a webové riešenia pre domácnosti a malé firmy v NRW.', contactTitle: 'Kontakt', linksTitle: 'Odkazy', socialTitle: 'Sociálne siete', legalTitle: 'Právne informácie', terms: 'Podmienky používania', privacy: 'Ochrana súkromia', impressum: 'Impressum', copyright: 'TiLADYS — IT Services & Webdesign. Všetky práva vyhradené.', location: 'NRW, Nemecko' }
  },
  fr: {
    nav: ['Accueil', 'Portfolio', 'À propos', 'Tarifs', 'Contact'],
    hero: 'Aide informatique simple et sites web pour particuliers et petites entreprises.',
    sub: 'Sites web, configuration PC, nettoyage, mises à niveau, Google Business et assistance numérique.',
    services: 'Des services qui simplifient l’informatique.', projects: 'Une sélection de projets récents.', prices: 'Tarifs et services', contact: 'Contact', about: 'À propos et qualifications', send: 'Envoyer',
    header: { getHelp: 'Obtenir de l’aide', language: 'Langue', navigation: 'Navigation principale', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu' },
    home: {
      servicesKicker: 'COMMENT PUIS-JE AIDER ?', servicesTitle: 'Des services qui rendent l’informatique', servicesAccent: 'simple.', servicesIntro: 'Tout ce dont vous avez besoin — au même endroit.', servicesButton: 'Tous les services + tarifs',
      services: [
        { title: 'Sites web', description: 'Des sites modernes, rapides et adaptés aux mobiles qui produisent des résultats.', items: ['One-page et multipage', 'Hébergement et domaine', 'Sécurité SSL', 'Mises à jour et assistance'] },
        { title: 'Aide PC et ordinateur portable', description: 'Configuration, nettoyage, mises à niveau et dépannage.', items: ['Configuration du système', 'Nettoyage et optimisation', 'Mises à niveau', 'Résolution de problèmes'] },
        { title: 'Google Business', description: 'Plus de visibilité, un meilleur profil et davantage de clients locaux.', items: ['Configuration du profil', 'Mises à jour et optimisation', 'Photos et publications', 'Visibilité locale'] },
        { title: 'Assistance numérique', description: 'E-mail, cloud, sauvegardes, VPN et aide informatique quotidienne.', items: ['E-mail et cloud', 'Sauvegardes et sécurité', 'Configuration VPN', 'Assistance informatique générale'] },
        { title: 'L’informatique pour vous', description: 'Une aide pratique sans jargon technique compliqué.', items: ['Conseils conviviaux', 'Solutions claires', 'Sans jargon', 'Assistance personnelle'] }
      ],
      processKicker: 'COMMENT ÇA MARCHE', processTitle: 'Un processus simple. Vous savez à quoi vous attendre.',
      processSteps: [
        { title: 'Demande', text: 'Expliquez-nous ce dont vous avez besoin.' },
        { title: 'Évaluation rapide', text: 'Nous vérifions la demande et proposons une solution.' },
        { title: 'Accord', text: 'Périmètre, délai et prix clairs.' },
        { title: 'Réalisation', text: 'Le travail est effectué avec soin et précision.' },
        { title: 'Vérification et remise', text: 'Nous testons, expliquons et remettons le résultat.' }
      ],
      ctaTitle: 'Besoin d’aide pour l’informatique ou votre site web ?', ctaText: 'Décrivez votre besoin et nous proposerons une solution simple.', ctaPrimary: 'Me contacter', ctaSecondary: 'Ouvrir le formulaire'
    },
    footer: { tagline: 'Solutions informatiques et web pratiques pour les particuliers et petites entreprises en NRW.', contactTitle: 'Contact', linksTitle: 'Liens', socialTitle: 'Réseaux sociaux', legalTitle: 'Mentions légales', terms: 'Conditions d’utilisation', privacy: 'Politique de confidentialité', impressum: 'Impressum', copyright: 'TiLADYS — IT Services & Webdesign. Tous droits réservés.', location: 'NRW, Allemagne' }
  }
};

export function t(locale: string): SiteCopy {
  return copy[locale as Locale] ?? copy.en;
}
