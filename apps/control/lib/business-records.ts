import { Prisma, type CustomerStatus, type CustomerType, type ServiceJobStatus } from '@prisma/client';
import { customerSchema, serviceJobSchema, companySchema } from '@tiladys/shared';

type Tx = Prisma.TransactionClient;

const emptyToNull = <T extends string>(value: T | '' | undefined): T | null => value ? value as T : null;
const decimalOrNull = (value: string | undefined) => value ? new Prisma.Decimal(value.replace(',', '.')) : null;

export function businessYear(date = new Date()) {
  const year = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Berlin', year: 'numeric' }).format(date);
  return Number(year);
}

export async function allocateNumber(tx: Tx, scope: 'CUSTOMER' | 'SERVICE_JOB', prefix: 'C' | 'JOB') {
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
  return {
    customerId: data.customerId, companyId: emptyToNull(data.companyId), servicePriceItemId: emptyToNull(data.servicePriceItemId),
    serviceType: emptyToNull(data.serviceType), title: data.title, description: emptyToNull(data.description),
    privateNotes: emptyToNull(data.privateNotes), customerVisibleNotes: emptyToNull(data.customerVisibleNotes),
    serviceDate: data.serviceDate ? new Date(data.serviceDate) : null, status: data.status as ServiceJobStatus,
    estimatedPrice: decimalOrNull(data.estimatedPrice), finalPrice: decimalOrNull(data.finalPrice),
    materialCost: decimalOrNull(data.materialCost), otherCost: decimalOrNull(data.otherCost),
    startTime: data.startTime ? new Date(data.startTime) : null, endTime: data.endTime ? new Date(data.endTime) : null,
    workDurationMinutes: data.workDurationMinutes ?? null,
  };
}

export function adminError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const details = error instanceof Error && 'details' in error ? (error as Error & { details?: unknown }).details : undefined;
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (message === 'UNAUTHORIZED') return { status: 401, body: { error: message } };
  if (message === 'INVALID_ORIGIN') return { status: 403, body: { error: message } };
  if (message.startsWith('INVALID_')) return { status: 400, body: { error: message, details } };
  if (code === 'P2025') return { status: 404, body: { error: 'NOT_FOUND' } };
  if (code === 'P2002') return { status: 409, body: { error: 'CONFLICT' } };
  console.error(`[${fallback}]`);
  return { status: 500, body: { error: fallback } };
}
