import type { Metadata } from 'next';
import {locales} from '@tiladys/shared';
import { localizedAlternates, localizedMetadata, siteUrl } from './seo';

type Localized = Record<string, string>;
export type ProjectSeo = {
  slug: string;
  title: Localized;
  summary: Localized;
  seoTitle?: Localized | null;
  seoDescription?: Localized | null;
  socialTitle?: Localized | null;
  socialDescription?: Localized | null;
  socialImageId?: string | null;
  coverImage?: string | null;
  images?: Array<{ id: string; url: string; alt?: Localized | null }>;
};
export function projectMetadata(project: ProjectSeo, locale: string): Metadata {
  const localized = (value: Localized) => value[locale]?.trim() || value.en?.trim() || Object.values(value).find((text) => text?.trim()) || '';
  // An untranslated override must not replace the requested language's project copy.
  const title = project.seoTitle?.[locale]?.trim() || localized(project.title);
  const description = project.seoDescription?.[locale]?.trim() || localized(project.summary);
  const socialTitle = project.socialTitle?.[locale]?.trim() || title;
  const socialDescription = project.socialDescription?.[locale]?.trim() || description;
  const selected = project.images?.find((image) => image.id === project.socialImageId) ?? project.images?.[0];
  const source = selected?.url || project.coverImage;
  const images = source ? [{ url: new URL(source, siteUrl).href, alt: selected?.alt?.[locale] || localized(project.title) }] : undefined;
  const metadata = localizedMetadata({ locale, pathname: `portfolio/${project.slug}`, title, description });
  return {
    ...metadata,
    robots: { index: Boolean(project.title[locale]?.trim()&&project.summary[locale]?.trim()), follow: true },
    alternates: localizedAlternates(locale, `portfolio/${project.slug}`, locales.filter((l) => Boolean(project.title[l]?.trim() && project.summary[l]?.trim()))),
    openGraph: { ...metadata.openGraph, title: socialTitle, description: socialDescription, images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title: socialTitle, description: socialDescription, images },
  };
}
