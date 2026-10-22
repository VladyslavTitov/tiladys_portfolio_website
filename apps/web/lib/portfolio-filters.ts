// Public presentation groups only; stored/dashboard category identifiers stay intact.
export const portfolioFilters = ['all', 'websites', 'services', '3d-printing', 'linux-servers'] as const;
export type PortfolioFilter = typeof portfolioFilters[number];
export const focusedPortfolioCategories = {
  websites: ['web-development'],
  '3d-printing': ['3d-printing'],
  'linux-servers': ['linux-servers'],
} as const;
export const serviceWorkCategories = ['pc-support', 'design', 'google-business', 'digital-support', 'data-protection', 'other', 'digital-help'] as const;
export const focusedCategoryIds: readonly string[] = Object.values(focusedPortfolioCategories).flat();

export function publicPortfolioCategory(category: string): Exclude<PortfolioFilter, 'all'> {
  for (const key of ['websites', '3d-printing', 'linux-servers'] as const) {
    if ((focusedPortfolioCategories[key] as readonly string[]).includes(category)) return key;
  }
  // Explicit safe fallback: historical/unknown work stays in All and Service Works.
  return 'services';
}

export function resolvePortfolioFilter(query: {filter?: string; category?: string}): PortfolioFilter {
  if (query.category) return publicPortfolioCategory(query.category);
  if ((portfolioFilters as readonly string[]).includes(query.filter || '')) return query.filter as PortfolioFilter;
  const legacy: Record<string, PortfolioFilter> = {web: 'websites', pc: 'services', design: 'services', digital: 'services', print: '3d-printing', linux: 'linux-servers'};
  return legacy[query.filter || ''] || 'all';
}

const copy = {
  en: {filters:{all:'All Projects',websites:'Websites',services:'Service Works','3d-printing':'3D Printing','linux-servers':'Linux & Servers'},search:'Search projects',placeholder:'Search projects...',clear:'Clear search',results:'Projects',updating:'Updating projects…',empty:'No published projects yet.',emptyText:'Completed work will appear here when it is ready to share.',noMatches:'No projects match your search and category.',reset:'Show all projects',preview:'Project preview unavailable',page:'Project pages'},
  de: {filters:{all:'Alle Projekte',websites:'Websites',services:'Servicearbeiten','3d-printing':'3D-Druck','linux-servers':'Linux & Server'},search:'Projekte suchen',placeholder:'Projekte suchen…',clear:'Suche löschen',results:'Projekte',updating:'Projekte werden aktualisiert…',empty:'Noch keine veröffentlichten Projekte.',emptyText:'Abgeschlossene Arbeiten erscheinen hier, sobald sie zur Veröffentlichung bereit sind.',noMatches:'Keine Projekte passen zur Suche und Kategorie.',reset:'Alle Projekte anzeigen',preview:'Projektvorschau nicht verfügbar',page:'Projektseiten'},
  fr: {filters:{all:'Tous les projets',websites:'Sites web',services:'Interventions','3d-printing':'Impression 3D','linux-servers':'Linux et serveurs'},search:'Rechercher des projets',placeholder:'Rechercher des projets…',clear:'Effacer la recherche',results:'Projets',updating:'Actualisation des projets…',empty:'Aucun projet publié pour le moment.',emptyText:'Les réalisations apparaîtront ici lorsqu’elles seront prêtes à être partagées.',noMatches:'Aucun projet ne correspond à la recherche et à la catégorie.',reset:'Afficher tous les projets',preview:'Aperçu du projet indisponible',page:'Pages de projets'},
  sk: {filters:{all:'Všetky projekty',websites:'Webové stránky',services:'Servisné práce','3d-printing':'3D tlač','linux-servers':'Linux a servery'},search:'Hľadať projekty',placeholder:'Hľadať projekty…',clear:'Vymazať vyhľadávanie',results:'Projekty',updating:'Aktualizujú sa projekty…',empty:'Zatiaľ nie sú zverejnené žiadne projekty.',emptyText:'Dokončené práce sa tu zobrazia, keď budú pripravené na zverejnenie.',noMatches:'Vyhľadávaniu a kategórii nezodpovedajú žiadne projekty.',reset:'Zobraziť všetky projekty',preview:'Ukážka projektu nie je dostupná',page:'Stránky projektov'},
  uk: {filters:{all:'Усі проєкти',websites:'Вебсайти',services:'Сервісні роботи','3d-printing':'3D-друк','linux-servers':'Linux і сервери'},search:'Пошук проєктів',placeholder:'Пошук проєктів…',clear:'Очистити пошук',results:'Проєкти',updating:'Оновлення проєктів…',empty:'Опублікованих проєктів поки немає.',emptyText:'Завершені роботи з’являться тут, коли будуть готові до публікації.',noMatches:'Жоден проєкт не відповідає пошуку та категорії.',reset:'Показати всі проєкти',preview:'Попередній перегляд недоступний',page:'Сторінки проєктів'},
  ru: {filters:{all:'Все проекты',websites:'Веб-сайты',services:'Сервисные работы','3d-printing':'3D-печать','linux-servers':'Linux и серверы'},search:'Поиск проектов',placeholder:'Поиск проектов…',clear:'Очистить поиск',results:'Проекты',updating:'Обновление проектов…',empty:'Опубликованных проектов пока нет.',emptyText:'Завершённые работы появятся здесь, когда будут готовы к публикации.',noMatches:'Нет проектов, соответствующих поиску и категории.',reset:'Показать все проекты',preview:'Предпросмотр проекта недоступен',page:'Страницы проектов'},
};
export const portfolioBrowseCopy = (locale: string) => copy[locale as keyof typeof copy] ?? copy.en;
