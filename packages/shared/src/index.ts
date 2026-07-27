import { z } from 'zod';

export const locales = ['en', 'de', 'uk', 'ru', 'sk', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const localizedOptionalTextSchema = z.record(z.string(), z.string().max(10_000));

export const localizedTextSchema = localizedOptionalTextSchema.refine(
  (value) => locales.some((locale) => Boolean(value[locale]?.trim())),
  { message: 'At least one translation is required.' },
);

const httpUrlSchema = z.string().trim().max(2_000).refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}, { message: 'Only HTTP and HTTPS URLs are allowed.' });

function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  // The admin may enter example.com/path. Store a valid absolute URL instead of
  // returning a generic 400 response for a missing protocol.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

const optionalHttpUrlSchema = z.preprocess(
  normalizeOptionalUrl,
  httpUrlSchema.optional().or(z.literal('')),
);

const optionalCoverImageSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('/')) return trimmed;
    return normalizeOptionalUrl(trimmed);
  },
  z.union([
    httpUrlSchema,
    z.string().regex(/^\/(?!\/).*$/, 'Use an HTTP(S) URL or a site-relative path beginning with /.').max(2_000),
    z.literal(''),
  ]),
);

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  service: z.string().trim().max(120).optional().or(z.literal('')),
  locale: z.enum(locales).default('en'),
  message: z.string().trim().min(10).max(4000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

export const projectPayloadSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  category: z.enum([
    'web-development',
    'pc-support',
    'design',
    'linux-servers',
    'google-business',
    'digital-support',
    'data-protection',
    'other',
  ]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000),
  title: localizedTextSchema,
  summary: localizedTextSchema,
  description: localizedOptionalTextSchema.optional(),
  type: localizedOptionalTextSchema.optional(),
  role: localizedOptionalTextSchema.optional(),
  workItems: z.record(z.string(), z.array(z.string().trim().min(1).max(500)).max(30)).optional(),
  websiteUrl: optionalHttpUrlSchema,
  githubUrl: optionalHttpUrlSchema,
  coverImage: optionalCoverImageSchema,
  technologies: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  projectDate: z.string().datetime().optional().or(z.literal('')),
});

// Kept as an alias for compatibility with existing imports.
export const projectSchema = projectPayloadSchema;

export const priceItemSchema = z.object({
  sectionId: z.string().min(1),
  code: z.string().trim().min(2).max(20),
  name: localizedTextSchema,
  price: z.string().trim().min(1).max(80),
  note: localizedOptionalTextSchema.optional(),
  sortOrder: z.number().int().min(0).max(10_000),
  active: z.boolean().default(true),
});

export const priceBulkSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().optional(),
      number: z.string().trim().min(1).max(10),
      title: localizedTextSchema,
      subtitle: localizedOptionalTextSchema.optional(),
      sortOrder: z.number().int().min(0).max(10_000),
      active: z.boolean(),
      items: z.array(
        z.object({
          id: z.string().optional(),
          code: z.string().trim().min(2).max(20),
          name: localizedTextSchema,
          price: z.string().trim().min(1).max(80),
          note: localizedOptionalTextSchema.optional(),
          sortOrder: z.number().int().min(0).max(10_000),
          active: z.boolean(),
        }),
      ),
    }),
  ),
  deletedSectionIds: z.array(z.string()).default([]),
  deletedItemIds: z.array(z.string()).default([]),
});
