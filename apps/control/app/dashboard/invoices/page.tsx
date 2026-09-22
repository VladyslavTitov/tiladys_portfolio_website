import { db } from '@tiladys/db';
import { defaultBillingSettings, invoiceInclude, serializeInvoice } from '@/lib/invoices';
import { InvoiceManager } from './invoice-manager';

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ invoiceId?: string }> }) {
  const query = await searchParams;
  const [rows, storedSettings] = await Promise.all([
    db.invoice.findMany({ include: invoiceInclude, orderBy: { createdAt: 'desc' }, take: 200 }),
    db.businessBillingSettings.findUnique({ where: { id: 'default' } }),
  ]);
  const invoices = rows.map((row) => serializeInvoice(row));
  const settings = storedSettings ?? defaultBillingSettings;
  return <><span className="eyebrow">Billing</span><h1>Invoices</h1><p className="admin-intro">Prepare drafts, issue frozen invoices, download PDFs, and track partial or full payments.</p><InvoiceManager initialInvoices={invoices as never} initialSettings={settings as never} initialInvoiceId={query.invoiceId ?? ''} /></>;
}
