import { z } from 'zod';

export const locales = ['en', 'de', 'uk', 'ru', 'sk', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const contactServiceIds = ['pc-laptop', 'websites', 'business-it'] as const;

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
  email: z.email().max(254),
  service: z.enum(contactServiceIds).optional().or(z.literal('')),
  locale: z.enum(locales).default('en'),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
}).strict();

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
  sortOrder: z.number().int().min(0).max(10_000),
  title: localizedTextSchema,
  summary: localizedTextSchema,
  seoTitle: z.partialRecord(z.enum(locales), z.string().trim().max(200)).optional(),
  seoDescription: z.partialRecord(z.enum(locales), z.string().trim().max(500)).optional(),
  socialTitle: z.partialRecord(z.enum(locales), z.string().trim().max(200)).optional(),
  socialDescription: z.partialRecord(z.enum(locales), z.string().trim().max(500)).optional(),
  socialImageId: z.string().max(100).optional().or(z.literal('')),
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

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
const optionalEmail = z.string().trim().email().max(254).optional().or(z.literal(''));
const optionalMoney = z.string().trim().regex(/^\d{1,10}(?:[.,]\d{1,2})?$/, 'Use a positive amount with at most two decimals.').optional().or(z.literal(''));
const requiredMoney = z.string().trim().regex(/^\d{1,10}(?:[.,]\d{1,2})?$/, 'Use a positive amount with at most two decimals.');

export const serviceJobLineItemSchema = z.object({
  id: optionalText(100),
  cataloguePriceItemId: optionalText(100),
  serviceName: z.string().trim().min(1).max(250),
  description: optionalText(5_000),
  quantity: z.string().trim().regex(/^\d{1,9}(?:[.,]\d{1,3})?$/, 'Use a positive quantity with at most three decimals.'),
  unit: z.string().trim().min(1).max(40),
  agreedUnitPrice: requiredMoney,
  priceConfirmed: z.boolean(),
  taxTreatment: z.enum(['UNCONFIRMED', 'VAT_STANDARD', 'VAT_REDUCED', 'ZERO_RATED', 'EXEMPT', 'KLEINUNTERNEHMER']),
  internalUnitCost: optionalMoney,
  sortOrder: z.number().int().min(0).max(10_000),
}).strict();

export const businessBillingSettingsSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  street: z.string().trim().min(2).max(200), postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(100), country: z.string().trim().min(2).max(100),
  email: z.email().max(254), phone: z.string().trim().min(3).max(50),
  taxMode: z.enum(['UNCONFIRMED', 'VAT', 'KLEINUNTERNEHMER', 'EXEMPT']),
  taxNumber: optionalText(100), vatId: optionalText(100), taxStatement: optionalText(500),
  bankAccountHolder: optionalText(200), iban: optionalText(50), bic: optionalText(20), bankName: optionalText(200),
  paymentTermsDays: z.number().int().min(0).max(365).nullable(), paymentInstructions: optionalText(1_000),
  confirmSettings: z.boolean().default(false),
}).strict();

export const invoiceLineSchema = z.object({
  serviceName: z.string().trim().min(1).max(250), description: optionalText(5_000),
  quantity: z.string().trim().regex(/^\d{1,9}(?:[.,]\d{1,3})?$/), unit: z.string().trim().min(1).max(40),
  unitPrice: requiredMoney,
  taxTreatment: z.enum(['UNCONFIRMED', 'VAT_STANDARD', 'VAT_REDUCED', 'ZERO_RATED', 'EXEMPT', 'KLEINUNTERNEHMER']),
}).strict();

export const invoiceFromJobSchema = z.object({
  serviceJobId: z.string().min(1).max(100),
  billingRecipientType: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  billingCompanyId: optionalText(100),
}).strict();

export const invoiceDraftSchema = z.object({
  billingCompanyId: optionalText(100), billingRecipientType: z.enum(["INDIVIDUAL", "COMPANY", "LEGACY"]).default("INDIVIDUAL"),
  customerId: z.string().min(1).max(100), serviceJobId: optionalText(100),
  issueDate: z.string().datetime().optional().or(z.literal('')), dueDate: z.string().datetime().optional().or(z.literal('')),
  serviceDateFrom: z.string().datetime().optional().or(z.literal('')), serviceDateTo: z.string().datetime().optional().or(z.literal('')),
  recipientName: z.string().trim().max(250), recipientCompany: optionalText(250), recipientEmail: optionalEmail,
  recipientStreet: z.string().trim().max(200), recipientPostalCode: z.string().trim().max(20),
  recipientCity: z.string().trim().max(100), recipientCountry: z.string().trim().min(2).max(100),
  customerReference: optionalText(200), notes: optionalText(2_000),
  lines: z.array(invoiceLineSchema).min(1).max(250),
}).strict().refine(value => value.billingRecipientType !== 'INDIVIDUAL' || Boolean(value.recipientName), { message: 'Enter the individual recipient name.', path: ['recipientName'] }).refine((value) => !value.serviceDateFrom || !value.serviceDateTo || new Date(value.serviceDateTo) >= new Date(value.serviceDateFrom), { message: 'Service end date must not precede start date.', path: ['serviceDateTo'] });

export const invoicePaymentSchema = z.object({ amount: requiredMoney, paidAt: z.string().datetime(), method: optionalText(100), reference: optionalText(200), note: optionalText(1_000) }).strict();

export const companySchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: optionalEmail,
  phone: optionalText(50),
  street: optionalText(200),
  postalCode: optionalText(20),
  city: optionalText(100),
  country: z.string().trim().min(2).max(2).default('DE'),
  website: optionalHttpUrlSchema,
  notes: optionalText(10_000),
}).strict();

export const customerSchema = z.object({
  type: z.enum(['PERSON', 'BUSINESS']).default('PERSON'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('LEAD'),
  firstName: optionalText(100),
  lastName: optionalText(100),
  companyId: optionalText(100),
  email: optionalEmail,
  phone: optionalText(50),
  secondaryPhone: optionalText(50),
  street: optionalText(200),
  postalCode: optionalText(20),
  city: optionalText(100),
  country: z.string().trim().min(2).max(2).default('DE'),
  preferredLanguage: z.enum(locales).default('de'),
  source: optionalText(100),
  notes: optionalText(10_000),
}).strict().refine((value) => Boolean(value.firstName || value.lastName || value.companyId), {
  message: 'Enter a person name or select a company.',
  path: ['lastName'],
});

export const customerNoteSchema = z.object({ body: z.string().trim().min(1).max(10_000) }).strict();

export const serviceJobSchema = z.object({
  customerId: z.string().min(1).max(100),
  companyId: optionalText(100),
  servicePriceItemId: optionalText(100),
  serviceType: optionalText(200),
  title: z.string().trim().min(2).max(250),
  description: optionalText(20_000),
  privateNotes: optionalText(20_000),
  customerVisibleNotes: optionalText(20_000),
  serviceDate: z.string().datetime().optional().or(z.literal('')),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  estimatedPrice: optionalMoney,
  finalPrice: optionalMoney,
  materialCost: optionalMoney,
  otherCost: optionalMoney,
  startTime: z.string().datetime().optional().or(z.literal('')),
  endTime: z.string().datetime().optional().or(z.literal('')),
  workDurationMinutes: z.number().int().min(0).max(1_000_000).optional().nullable(),
  lineItems: z.array(serviceJobLineItemSchema).max(100).default([]),
}).strict().refine((value) => !value.startTime || !value.endTime || new Date(value.endTime) >= new Date(value.startTime), {
  message: 'End time must be after start time.', path: ['endTime'],
});
