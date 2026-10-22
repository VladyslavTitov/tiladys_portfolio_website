import { unstable_cache } from 'next/cache';
import { db } from '@tiladys/db';
import sharp from 'sharp';

type ImageKind = 'project' | 'product';

// Image bytes are immutable: edits upload a new image ID; alt/order edits keep it.
// This is an internal derivative cache, never a publicly addressable media cache.
const readThumbnail = unstable_cache(async (kind: ImageKind, id: string, width: number) => {
  const image = kind === 'project'
    ? await db.projectImage.findUnique({ where: { id }, select: { data: true } })
    : await db.productImage.findUnique({ where: { id }, select: { data: true } });
  if (!image) throw new Error('IMAGE_NOT_FOUND');
  const data = await sharp(image.data, { limitInputPixels: 24_000_000 })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  // JSON-safe storage in Next's persistent Data Cache.
  return data.toString('base64');
}, ['public-thumbnail-webp-v1'], { revalidate: 86400 });

export async function publicThumbnail(kind: ImageKind, id: string, width: number) {
  return Buffer.from(await readThumbnail(kind, id, width), 'base64');
}
