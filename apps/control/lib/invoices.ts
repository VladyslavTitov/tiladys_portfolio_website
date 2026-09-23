import { validationDetails } from './validation-details';
import crypto from 'node:crypto';
import { Prisma, type BusinessBillingSettings, type BusinessTaxMode, type JobLineTaxTreatment, type PrismaClient } from '@prisma/client';
import { businessBillingSettingsSchema, invoiceDraftSchema, invoicePaymentSchema } from '@tiladys/shared';
import { allocateNumber } from './business-records';
import { generateInvoicePdf } from './invoice-pdf';

export const defaultBillingSettings = {
  id: 'default', legalName: 'TiLADYS – Vladyslav Titov', street: 'Kronenstraße 19', postalCode: '45479',
  city: 'Mülheim an der Ruhr', country: 'Germany', email: 'contact@tiladys.com', phone: '+49 163 7235608',
  taxMode: 'UNCONFIRMED' as BusinessTaxMode, taxNumber: null, vatId: null, taxStatement: null,
  bankAccountHolder: null, iban: null, bic: null, bankName: null, paymentTermsDays: null,
  paymentInstructions: null, settingsConfirmedAt: null,
};

const nullable = (value?: string) => value || null;
const money = (value: string) => new Prisma.Decimal(value.replace(',', '.'));
const date = (value?: string) => value ? new Date(value) : null;

export function parseBillingSettings(value: unknown) {
  const parsed = businessBillingSettingsSchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error('INVALID_BILLING_SETTINGS'), { details: validationDetails(parsed.error) });
  const data = parsed.data;
  return {
    legalName: data.legalName, street: data.street, postalCode: data.postalCode, city: data.city, country: data.country,
    email: data.email, phone: data.phone, taxMode: data.taxMode as BusinessTaxMode,
    taxNumber: nullable(data.taxNumber), vatId: nullable(data.vatId), taxStatement: nullable(data.taxStatement),
    bankAccountHolder: nullable(data.bankAccountHolder), iban: nullable(data.iban), bic: nullable(data.bic), bankName: nullable(data.bankName),
    paymentTermsDays: data.paymentTermsDays, paymentInstructions: nullable(data.paymentInstructions),
    settingsConfirmedAt: data.confirmSettings && data.taxMode !== 'UNCONFIRMED' ? new Date() : null,
  };
}

export function calculateInvoiceLines(lines: Array<{ serviceName: string; description?: string; quantity: string; unit: string; unitPrice: string; taxTreatment: string }>) {
  return lines.map((line, sortOrder) => {
    const quantity = new Prisma.Decimal(line.quantity.replace(',', '.'));
    const unitPrice = money(line.unitPrice);
    const subtotal = quantity.mul(unitPrice).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const taxTreatment = line.taxTreatment as JobLineTaxTreatment;
    const taxRate = taxTreatment === 'VAT_STANDARD' ? new Prisma.Decimal(19) : taxTreatment === 'VAT_REDUCED' ? new Prisma.Decimal(7) : ['ZERO_RATED', 'EXEMPT', 'KLEINUNTERNEHMER'].includes(taxTreatment) ? new Prisma.Decimal(0) : null;
    const taxAmount = taxRate === null ? null : subtotal.mul(taxRate).div(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    return { serviceName: line.serviceName, description: nullable(line.description), quantity, unit: line.unit, unitPrice, taxTreatment, taxRate, subtotal, taxAmount, total: subtotal.add(taxAmount ?? 0), sortOrder };
  });
}

export function parseInvoiceDraft(value: unknown) {
  const parsed = invoiceDraftSchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error('INVALID_INVOICE'), { details: validationDetails(parsed.error) });
  const data = parsed.data; const lines = calculateInvoiceLines(data.lines);
  const subtotal = lines.reduce((sum, line) => sum.add(line.subtotal), new Prisma.Decimal(0));
  const hasUnknownTax = lines.some((line) => line.taxAmount === null);
  const taxTotal = hasUnknownTax ? null : lines.reduce((sum, line) => sum.add(line.taxAmount ?? 0), new Prisma.Decimal(0));
  return {
    invoice: { billingCompanyId: nullable(data.billingCompanyId), billingRecipientType: data.billingRecipientType, customerId: data.customerId, serviceJobId: nullable(data.serviceJobId), issueDate: date(data.issueDate), dueDate: date(data.dueDate), serviceDateFrom: date(data.serviceDateFrom), serviceDateTo: date(data.serviceDateTo), recipientName: data.recipientName, recipientCompany: nullable(data.recipientCompany), recipientEmail: nullable(data.recipientEmail), recipientStreet: data.recipientStreet, recipientPostalCode: data.recipientPostalCode, recipientCity: data.recipientCity, recipientCountry: data.recipientCountry, customerReference: nullable(data.customerReference), notes: nullable(data.notes), subtotal, taxTotal, total: subtotal.add(taxTotal ?? 0) }, lines,
  };
}

export function parsePayment(value: unknown) {
  const parsed = invoicePaymentSchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error('INVALID_PAYMENT'), { details: validationDetails(parsed.error) });
  return { amount: money(parsed.data.amount), paidAt: new Date(parsed.data.paidAt), method: nullable(parsed.data.method), reference: nullable(parsed.data.reference), note: nullable(parsed.data.note) };
}

type BillingSettings = Omit<BusinessBillingSettings, 'createdAt' | 'updatedAt'>;

export function assertInvoiceIssuable(invoice: { billingRecipientType?: string; recipientCompany?: string | null; recipientName: string; recipientStreet: string; recipientPostalCode: string; recipientCity: string; issueDate: Date | null; lines: Array<{ taxTreatment: JobLineTaxTreatment }> }, settings: BillingSettings) {
  if (!settings.settingsConfirmedAt || settings.taxMode === 'UNCONFIRMED') throw new Error('BILLING_SETTINGS_UNCONFIRMED');
  if (!settings.taxNumber && !settings.vatId) throw new Error('TAX_IDENTIFIER_REQUIRED');
  if ((invoice.billingRecipientType === 'COMPANY' ? !invoice.recipientCompany : !invoice.recipientName) || !invoice.recipientStreet || !invoice.recipientPostalCode || !invoice.recipientCity || !invoice.issueDate) throw new Error('INVOICE_DETAILS_INCOMPLETE');
  if (!invoice.lines.length || invoice.lines.some((line) => line.taxTreatment === 'UNCONFIRMED')) throw new Error('INVOICE_TAX_INCOMPLETE');
  if (settings.taxMode === 'VAT' && invoice.lines.some((line) => line.taxTreatment === 'KLEINUNTERNEHMER')) throw new Error('INVOICE_TAX_MISMATCH');
  if (settings.taxMode === 'KLEINUNTERNEHMER' && invoice.lines.some((line) => line.taxTreatment !== 'KLEINUNTERNEHMER')) throw new Error('INVOICE_TAX_MISMATCH');
  if (settings.taxMode === 'KLEINUNTERNEHMER' && !settings.taxStatement) throw new Error('TAX_STATEMENT_REQUIRED');
}

export function sellerSnapshot(settings: BillingSettings) {
  return { sellerLegalName: settings.legalName, sellerStreet: settings.street, sellerPostalCode: settings.postalCode, sellerCity: settings.city, sellerCountry: settings.country, sellerEmail: settings.email, sellerPhone: settings.phone, sellerTaxMode: settings.taxMode, sellerTaxNumber: settings.taxNumber, sellerVatId: settings.vatId, sellerTaxStatement: settings.taxStatement, sellerBankAccountHolder: settings.bankAccountHolder, sellerIban: settings.iban, sellerBic: settings.bic, sellerBankName: settings.bankName, paymentTermsDays: settings.paymentTermsDays, paymentInstructions: settings.paymentInstructions };
}

export const invoiceInclude = { lines: { orderBy: { sortOrder: 'asc' as const } }, payments: { orderBy: { paidAt: 'asc' as const } }, billingCompany: { select: { id: true, name: true } }, customer: { select: { customerNumber: true, firstName: true, lastName: true } }, serviceJob: { select: { jobNumber: true, title: true } } };

export function serializeInvoice<T extends Record<string, unknown>>(invoice: T & { subtotal: Prisma.Decimal; taxTotal: Prisma.Decimal | null; total: Prisma.Decimal; issuedPdf?: Uint8Array | null; lines: Array<Record<string, unknown> & { quantity: Prisma.Decimal; unitPrice: Prisma.Decimal; taxRate: Prisma.Decimal | null; subtotal: Prisma.Decimal; taxAmount: Prisma.Decimal | null; total: Prisma.Decimal }>; payments: Array<Record<string, unknown> & { amount: Prisma.Decimal }> }) {
  const paid = invoice.payments.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0));
  const balance = invoice.total.sub(paid);
  const dateValue = (key: string) => invoice[key] instanceof Date ? (invoice[key] as Date).toISOString() : invoice[key];
  return { ...invoice, paymentStatus: balance.lte(0) ? 'PAID' : paid.isZero() ? 'UNPAID' : 'PARTIAL', issueDate: dateValue('issueDate'), dueDate: dateValue('dueDate'), serviceDateFrom: dateValue('serviceDateFrom'), serviceDateTo: dateValue('serviceDateTo'), issuedAt: dateValue('issuedAt'), createdAt: dateValue('createdAt'), updatedAt: dateValue('updatedAt'), issuedPdf: undefined, subtotal: invoice.subtotal.toString(), taxTotal: invoice.taxTotal?.toString() ?? null, total: invoice.total.toString(), paidTotal: paid.toString(), outstanding: (balance.isNegative() ? new Prisma.Decimal(0) : balance).toString(), lines: invoice.lines.map((line) => ({ ...line, quantity: line.quantity.toString(), unitPrice: line.unitPrice.toString(), taxRate: line.taxRate?.toString() ?? null, subtotal: line.subtotal.toString(), taxAmount: line.taxAmount?.toString() ?? null, total: line.total.toString() })), payments: invoice.payments.map((payment) => ({ ...payment, paidAt: payment.paidAt instanceof Date ? payment.paidAt.toISOString() : payment.paidAt, createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt, amount: payment.amount.toString() })) };
}

export async function issueInvoice(database: PrismaClient, id: string, userId: string) {
  return database.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`);
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
    if (invoice.status === 'ISSUED') return invoice;
    if (invoice.status !== 'DRAFT') throw new Error('INVOICE_NOT_ISSUABLE');
    const settings = await tx.businessBillingSettings.findUnique({ where: { id: 'default' } }) ?? defaultBillingSettings;
    if (invoice.billingRecipientType === 'LEGACY') throw new Error('INVALID_BILLING_RECIPIENT');
    assertInvoiceIssuable(invoice, settings);
    const invoiceNumber = await allocateNumber(tx, 'INVOICE', 'INV'); const issuedAt = new Date();
    const pdf = await generateInvoicePdf({ ...invoice, ...sellerSnapshot(settings), invoiceNumber, status: 'ISSUED' });
    const updated = await tx.invoice.update({ where: { id }, data: { ...sellerSnapshot(settings), invoiceNumber, status: 'ISSUED', issuedAt, issuedPdf: pdf, issuedPdfChecksum: crypto.createHash('sha256').update(pdf).digest('hex'), issuedPdfSize: pdf.byteLength }, include: invoiceInclude });
    await tx.customerActivity.create({ data: { customerId: invoice.customerId, type: 'INVOICE_ISSUED', summary: `Invoice ${invoiceNumber} issued`, metadata: { invoiceId: id, serviceJobId: invoice.serviceJobId }, createdById: userId } });
    await tx.auditLog.create({ data: { userId, action: 'INVOICE_ISSUE', entity: 'Invoice', entityId: id, metadata: { invoiceNumber, pdfChecksum: updated.issuedPdfChecksum } } });
    return updated;
  }, { timeout: 15_000 });
}
