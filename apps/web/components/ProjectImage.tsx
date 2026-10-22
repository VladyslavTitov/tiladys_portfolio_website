'use client';
import Image, { type ImageLoaderProps } from 'next/image';
import { useState, type ReactNode } from 'react';

function mediaLoader({ src, width }: ImageLoaderProps) {
  const url = new URL(src, 'http://local.invalid');
  url.searchParams.set('w', String(Math.min(width, 1920)));
  return src.startsWith('/') ? `${url.pathname}${url.search}` : url.toString();
}
export function ProjectImage({ src, alt, sizes, priority = false, fallback }: { src?: string | null; alt: string; sizes: string; priority?: boolean; fallback?: ReactNode }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if(!src || failedSource===src)return fallback ?? <span className="project-missing-media" role="img" aria-label={`Image unavailable: ${alt}`}>Image unavailable</span>;
  const source = src;
  const media = /\/api\/public\/(?:product-)?media\/[a-zA-Z0-9_-]+(?:\?|$)/.test(source);
  const external = /^https?:\/\//.test(source);
  // Our media endpoint resizes after checking publication on every request. Avoid Next's persistent optimizer cache for revocable media.
  return <Image src={source} alt={alt} width={1440} height={960} sizes={sizes} priority={priority}
    onError={() => setFailedSource(source)}
    loader={media ? mediaLoader : undefined} unoptimized={external && !media} />;
}
