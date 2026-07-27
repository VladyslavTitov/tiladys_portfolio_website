import { projectPayloadSchema } from '@tiladys/shared';

export const MAX_PROJECT_IMAGES = 10;
// Keeps every upload below common serverless request limits after multipart overhead.
export const MAX_PROJECT_IMAGE_BYTES = 4 * 1024 * 1024;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export function parseProjectPayload(input: unknown) {
  const parsed = projectPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const error = new Error('INVALID_PROJECT') as Error & { details?: unknown };
    error.details = {
      ...parsed.error.flatten(),
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
    throw error;
  }
  return parsed.data;
}

function bytesEqual(bytes: Uint8Array, expected: number[], offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function validImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') return bytesEqual(bytes, [0xff, 0xd8, 0xff]);
  if (mimeType === 'image/png') return bytesEqual(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === 'image/webp') {
    return bytesEqual(bytes, [0x52, 0x49, 0x46, 0x46]) && bytesEqual(bytes, [0x57, 0x45, 0x42, 0x50], 8);
  }
  if (mimeType === 'image/avif') {
    if (!bytesEqual(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return false;
    const header = new TextDecoder('ascii').decode(bytes.slice(0, 40));
    return header.includes('avif') || header.includes('avis');
  }
  return false;
}

function safeFilename(value: string, sortOrder: number) {
  const filename = value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}._ ()-]+/gu, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return filename || `project-image-${sortOrder + 1}`;
}

export async function parseProjectImage(input: FormDataEntryValue | null, sortOrder: number) {
  if (!(input instanceof File) || input.size < 1) throw new Error('MISSING_IMAGE');
  if (!acceptedTypes.has(input.type)) throw new Error('INVALID_IMAGE_TYPE');
  if (input.size > MAX_PROJECT_IMAGE_BYTES) throw new Error('IMAGE_TOO_LARGE');
  const arrayBuffer = await input.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!validImageSignature(bytes, input.type)) throw new Error('INVALID_IMAGE_CONTENT');
  return {
    filename: safeFilename(input.name, sortOrder),
    mimeType: input.type,
    size: input.size,
    data: Buffer.from(arrayBuffer),
    sortOrder,
  };
}

export function projectData(payload: ReturnType<typeof projectPayloadSchema.parse>) {
  return {
    slug: payload.slug,
    category: payload.category,
    status: payload.status,
    featured: payload.featured,
    sortOrder: payload.sortOrder,
    title: payload.title,
    summary: payload.summary,
    description: payload.description ?? undefined,
    type: payload.type ?? undefined,
    role: payload.role ?? undefined,
    workItems: payload.workItems ?? undefined,
    websiteUrl: payload.websiteUrl || null,
    githubUrl: payload.githubUrl || null,
    coverImage: payload.coverImage || null,
    technologies: payload.technologies,
    projectDate: payload.projectDate ? new Date(payload.projectDate) : null,
  };
}
