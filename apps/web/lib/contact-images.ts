import sharp from 'sharp';
import { CONTACT_IMAGE_TYPES, MAX_CONTACT_IMAGES, MAX_CONTACT_IMAGE_BYTES, MAX_CONTACT_TOTAL_BYTES, MAX_CONTACT_DIMENSION, MAX_CONTACT_PIXELS } from './contact-upload-limits.ts';

type InputCode = 'IMAGE_LIMIT' | 'IMAGE_TYPE' | 'IMAGE_DIMENSIONS' | 'IMAGE_INVALID' | 'REQUEST_SIZE' | 'VALIDATION';
export class ContactInputError extends Error {
  code: InputCode;
  constructor(code: InputCode) { super(code); this.code = code; }
}

export async function prepareContactImages(files: File[]) {
  if (files.length > MAX_CONTACT_IMAGES || files.reduce((sum, file) => sum + file.size, 0) > MAX_CONTACT_TOTAL_BYTES) throw new ContactInputError('IMAGE_LIMIT');
  const images = [];
  // Sequential decode bounds peak memory; never persist original bytes or filenames.
  for (const [index, file] of files.entries()) {
    if (file.size < 1 || file.size > MAX_CONTACT_IMAGE_BYTES) throw new ContactInputError('IMAGE_LIMIT');
    if (!(CONTACT_IMAGE_TYPES as readonly string[]).includes(file.type)) throw new ContactInputError('IMAGE_TYPE');
    const bytes = Buffer.from(await file.arrayBuffer());
    const signature = file.type === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : file.type === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!signature) throw new ContactInputError('IMAGE_INVALID');
    try {
      const decoder = sharp(bytes, { limitInputPixels: MAX_CONTACT_PIXELS, failOn: 'warning', animated: false });
      const metadata = await decoder.metadata();
      if (!metadata.width || !metadata.height || metadata.width > MAX_CONTACT_DIMENSION || metadata.height > MAX_CONTACT_DIMENSION || metadata.width * metadata.height > MAX_CONTACT_PIXELS || (metadata.pages ?? 1) > 1) throw new ContactInputError('IMAGE_DIMENSIONS');
      const { data, info } = await decoder.rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      if (data.byteLength > MAX_CONTACT_IMAGE_BYTES) throw new ContactInputError('IMAGE_LIMIT');
      images.push({ filename: `inquiry-image-${index + 1}.webp`, mimeType: 'image/webp', size: data.byteLength, width: info.width, height: info.height, data: new Uint8Array(data) });
    } catch (error) {
      if (error instanceof ContactInputError) throw error;
      throw new ContactInputError('IMAGE_INVALID');
    }
  }
  return images;
}

export async function boundedBody(request: Request, maximum: number) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (!Number.isFinite(declared) || declared < 0 || declared > maximum) throw new ContactInputError('REQUEST_SIZE');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); throw new ContactInputError('REQUEST_SIZE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Uint8Array(Buffer.concat(chunks, length));
}
