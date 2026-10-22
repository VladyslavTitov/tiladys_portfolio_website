import type { PublicProject } from '../components/PortfolioExplorer';

export async function loadPortfolio(request: () => Promise<PublicProject[]>): Promise<
  { state: 'ready'; projects: PublicProject[] } | { state: 'unavailable' }
> {
  try {
    const projects = await request();
    if (!Array.isArray(projects)) return { state: 'unavailable' };
    return { state: 'ready', projects };
  } catch {
    return { state: 'unavailable' };
  }
}

const copy = {
  en: { loading: 'Loading projects…', title: 'Projects are temporarily unavailable', text: 'We couldn’t load the portfolio. Please try again shortly.', retry: 'Try again' },
  de: { loading: 'Projekte werden geladen…', title: 'Projekte sind vorübergehend nicht verfügbar', text: 'Das Portfolio konnte nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.', retry: 'Erneut versuchen' },
  uk: { loading: 'Завантаження проєктів…', title: 'Проєкти тимчасово недоступні', text: 'Не вдалося завантажити портфоліо. Спробуйте ще раз трохи пізніше.', retry: 'Спробувати ще раз' },
  ru: { loading: 'Загрузка проектов…', title: 'Проекты временно недоступны', text: 'Не удалось загрузить портфолио. Попробуйте ещё раз чуть позже.', retry: 'Попробовать ещё раз' },
  sk: { loading: 'Načítavajú sa projekty…', title: 'Projekty sú dočasne nedostupné', text: 'Portfólio sa nepodarilo načítať. Skúste to, prosím, o chvíľu znova.', retry: 'Skúsiť znova' },
  fr: { loading: 'Chargement des projets…', title: 'Les projets sont temporairement indisponibles', text: 'Le portfolio n’a pas pu être chargé. Veuillez réessayer dans un instant.', retry: 'Réessayer' },
};
export const portfolioStateCopy = (locale: string) => copy[locale as keyof typeof copy] ?? copy.en;
