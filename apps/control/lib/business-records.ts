import { Prisma, type CataloguePriceMode, type CustomerStatus, type CustomerType, type JobLineTaxTreatment, type ServiceJobStatus } from '@prisma/client';
import { customerSchema, serviceJobSchema, companySchema } from '@tiladys/shared';

type Tx = Prisma.TransactionClient;

const emptyToNull = <T extends string>(value: T | '' | undefined): T | null => value ? value as T : null;
const decimalOrNull = (value: string | undefined) => value ? new Prisma.Decimal(value.replace(',', '.')) : null;

export function businessYear(date = new Date()) {
  const year = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Berlin', year: 'numeric' }).format(date);
  return Number(year);
}

export async function allocateNumber(tx: Tx, scope: 'CUSTOMER' | 'SERVICE_JOB' | 'INVOICE', prefix: 'C' | 'JOB' | 'INV') {
  const year = businessYear();
  const rows = await tx.$queryRaw<Array<{ value: number }>>(Prisma.sql`
    INSERT INTO "NumberSequence" ("scope", "year", "nextValue") VALUES (${scope}, ${year}, 2)
    ON CONFLICT ("scope", "year") DO UPDATE SET "nextValue" = "NumberSequence"."nextValue" + 1
    RETURNING "nextValue" - 1 AS value
  `);
  return `${prefix}-${year}-${String(rows[0].value).padStart(4, '0')}`;
}

export function parseCustomer(value: unknown) {
  const parsed = customerSchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error('INVALID_CUSTOMER'), { details: parsed.error.flatten() });
  const data = parsed.data;
  return {
    type: data.type as CustomerType,
    status: data.status as CustomerStatus,
    firstName: emptyToNull(data.firstName), lastName: emptyToNull(data.lastName), companyId: emptyToNull(data.companyId),
    email: emptyToNull(data.email), phone: emptyToNull(data.phone), secondaryPhone: emptyToNull(data.secondaryPhone),
    street: emptyToNull(data.street), postalCode: emptyToNull(data.postalCode), city: emptyToNull(data.city),
    country: data.country.toUpperCase(), preferredLanguage: data.preferredLanguage,
    source: emptyToNull(data.source), notes: emptyToNull(data.notes),
    archivedAt: data.status === 'ARCHIVED' ? new Date() : null,
  };
}

export function parseCompany(value: unknown) {
  const parsed = companySchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error('INVALID_COMPANY'), { details: parsed.error.flatten() });
  return { ...parsed.data, email: emptyToNull(parsed.data.email), phone: emptyToNull(parsed.data.phone), street: emptyToNull(parsed.data.street), postalCode: emptyToNull(parsed.data.postalCode), city: emptyToNull(parsed.data.city), website: emptyToNull(parsed.data.website), notes: emptyToNull(parsed.data.notes), country: parsed.data.country.toUpperCase() };
}

export function parseServiceJob(value: unknown) {
  const parsed = serviceJobSchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error('INVALID_SERVICE_JOB'), { details: parsed.error.flatten() });
  const data = parsed.data;
  return { job: {
    customerId: data.customerId, companyId: emptyToNull(data.companyId), servicePriceItemId: emptyToNull(data.servicePriceItemId),
    serviceType: emptyToNull(data.serviceType), title: data.title, description: emptyToNull(data.description),
    privateNotes: emptyToNull(data.privateNotes), customerVisibleNotes: emptyToNull(data.customerVisibleNotes),
    serviceDate: data.serviceDate ? new Date(data.serviceDate) : null, status: data.status as ServiceJobStatus,
    estimatedPrice: decimalOrNull(data.estimatedPrice), finalPrice: decimalOrNull(data.finalPrice),
    materialCost: decimalOrNull(data.materialCost), otherCost: decimalOrNull(data.otherCost),
    startTime: data.startTime ? new Date(data.startTime) : null, endTime: data.endTime ? new Date(data.endTime) : null,
    workDurationMinutes: data.workDurationMinutes ?? null,
  }, lineItems: data.lineItems };
}

function localized(value: Prisma.JsonValue | null, fallback = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  return ['de', 'en', 'uk', 'ru', 'sk', 'fr'].map((key) => record[key]).find((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())) ?? fallback;
}

export function cataloguePriceDetails(price: string): { mode: CataloguePriceMode; unit: string; amount: Prisma.Decimal | null } {
  const lower = price.toLocaleLowerCase('de-DE');
  const mode: CataloguePriceMode = /(?:\/|pro\s+)(?:месяц|monat|month)|monthly/.test(lower) ? 'MONTHLY'
    : /(?:от|\bab\b|\bfrom\b)/.test(lower) ? 'FROM'
    : /(?:\/|pro\s+)(?:час|stunde|hour)/.test(lower) ? 'HOURLY'
    : lower.includes('%') ? 'PERCENTAGE' : /€/.test(price) ? 'FIXED' : 'MANUAL';
  const raw = price.match(/\d[\d\s]*(?:[.,]\d{1,2})?/)?.[0]?.replace(/\s/g, '').replace(',', '.');
  const amount = raw ? new Prisma.Decimal(raw) : null;
  const unit = mode === 'MONTHLY' ? 'month' : mode === 'HOURLY' ? 'hour' : mode === 'PERCENTAGE' ? 'percent' : 'item';
  return { mode, unit, amount };
}

export async function prepareJobLineItems(tx: Tx, items: ReturnType<typeof parseServiceJob>['lineItems']) {
  const ids = [...new Set(items.map((item) => item.cataloguePriceItemId).filter((id): id is string => Boolean(id)))];
  const catalogue = await tx.priceItem.findMany({ where: { id: { in: ids } }, select: { id: true, code: true, name: true, note: true, price: true } });
  const byId = new Map(catalogue.map((item) => [item.id, item]));
  return items.map((item, index) => {
    const source = item.cataloguePriceItemId ? byId.get(item.cataloguePriceItemId) : undefined;
    if (item.cataloguePriceItemId && !source) throw new Error('INVALID_CATALOGUE_ITEM');
    const details = source ? cataloguePriceDetails(source.price) : { mode: 'MANUAL' as CataloguePriceMode, unit: item.unit, amount: null };
    if (source && ['FROM', 'MONTHLY', 'PERCENTAGE'].includes(details.mode) && !item.priceConfirmed) throw new Error('PRICE_CONFIRMATION_REQUIRED');
    const quantity = new Prisma.Decimal(item.quantity.replace(',', '.'));
    const agreedUnitPrice = new Prisma.Decimal(item.agreedUnitPrice.replace(',', '.'));
    const subtotal = quantity.mul(agreedUnitPrice).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const rates: Partial<Record<JobLineTaxTreatment, Prisma.Decimal>> = { VAT_STANDARD: new Prisma.Decimal(19), VAT_REDUCED: new Prisma.Decimal(7), ZERO_RATED: new Prisma.Decimal(0) };
    const taxTreatment = item.taxTreatment as JobLineTaxTreatment;
    const taxRate = rates[taxTreatment] ?? null;
    const taxAmount = taxRate ? subtotal.mul(taxRate).div(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP) : taxTreatment === 'UNCONFIRMED' ? null : new Prisma.Decimal(0);
    return {
      cataloguePriceItemId: source?.id ?? null,
      serviceName: item.serviceName || (source ? localized(source.name, source.code) : ''),
      description: emptyToNull(item.description) || (source ? localized(source.note) || null : null),
      quantity, unit: item.unit || details.unit,
      cataloguePriceText: source?.price ?? null, catalogueUnitPrice: details.amount,
      cataloguePriceMode: details.mode, priceConfirmed: item.priceConfirmed,
      agreedUnitPrice, taxTreatment, taxRate, subtotal, taxAmount,
      total: taxAmount ? subtotal.add(taxAmount) : subtotal,
      internalUnitCost: item.internalUnitCost ? new Prisma.Decimal(item.internalUnitCost.replace(',', '.')) : null,
      sortOrder: index,
    };
  });
}

export function adminError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const details = error instanceof Error && 'details' in error ? (error as Error & { details?: unknown }).details : undefined;
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (message === 'UNAUTHORIZED') return { status: 401, body: { error: message } };
  if (message === 'INVALID_ORIGIN') return { status: 403, body: { error: message } };
  if (message.startsWith('INVALID_')) return { status: 400, body: { error: message, details } };
  if (message === 'PRICE_CONFIRMATION_REQUIRED') return { status: 400, body: { error: message } };
  if (['BILLING_SETTINGS_UNCONFIRMED','TAX_IDENTIFIER_REQUIRED','INVOICE_DETAILS_INCOMPLETE','INVOICE_TAX_INCOMPLETE','INVOICE_TAX_MISMATCH','TAX_STATEMENT_REQUIRED','INVOICE_JOB_HAS_NO_LINES'].includes(message)) return { status: 422, body: { error: message } };
  if (['ISSUED_INVOICE_IMMUTABLE','INVOICE_NOT_ISSUABLE','PAYMENT_REQUIRES_ISSUED_INVOICE','PAYMENT_EXCEEDS_BALANCE'].includes(message)) return { status: 409, body: { error: message } };
  if (code === 'P2025') return { status: 404, body: { error: 'NOT_FOUND' } };
  if (code === 'P2002') return { status: 409, body: { error: 'CONFLICT' } };
  console.error(`[${fallback}]`, error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { type: typeof error });
  return { status: 500, body: { error: fallback } };
}
