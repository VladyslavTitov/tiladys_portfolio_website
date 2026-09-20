'use client';
import Image, { type ImageLoaderProps } from 'next/image';

const fallback = '/services/tiladys-service-website-creation.png';
function mediaLoader({ src, width }: ImageLoaderProps) {
  const url = new URL(src, 'http://local.invalid');
  url.searchParams.set('w', String(Math.min(width, 1920)));
  return src.startsWith('/') ? `${url.pathname}${url.search}` : url.toString();
}
export function ProjectImage({ src, alt, sizes, priority = false }: { src?: string | null; alt: string; sizes: string; priority?: boolean }) {
  const source = src || fallback;
  const media = /\/api\/public\/media\/[a-zA-Z0-9_-]+(?:\?|$)/.test(source);
  const external = /^https?:\/\//.test(source);
  // Our media endpoint resizes after checking publication on every request. Avoid Next's persistent optimizer cache for revocable media.
  return <Image src={source} alt={alt} width={1440} height={960} sizes={sizes} priority={priority}
    loader={media ? mediaLoader : undefined} unoptimized={external && !media} />;
}
