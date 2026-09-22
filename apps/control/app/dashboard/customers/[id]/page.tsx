import { notFound } from 'next/navigation';
import { db } from '@tiladys/db';
import { CustomerProfile } from './customer-profile';

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row, companies] = await Promise.all([
    db.customer.findUnique({ where: { id }, include: { company: { select: { id: true, name: true } }, customerNotes: { include: { createdBy: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' } }, activities: { include: { createdBy: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }, serviceJobs: { select: { id: true, jobNumber: true, title: true, status: true, serviceDate: true, finalPrice: true }, orderBy: { createdAt: 'desc' } }, invoices: { select: { id: true, invoiceNumber: true, status: true, total: true, issueDate: true, payments: { select: { amount: true } } }, orderBy: { createdAt: 'desc' } }, files: { select: { id: true, filename: true, kind: true, createdAt: true }, orderBy: { createdAt: 'desc' } } } }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!row) notFound();
  const initial = { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), archivedAt: row.archivedAt?.toISOString() ?? null, customerNotes: row.customerNotes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })), activities: row.activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })), serviceJobs: row.serviceJobs.map((j) => ({ ...j, serviceDate: j.serviceDate?.toISOString() ?? null, finalPrice: j.finalPrice?.toString() ?? null })), invoices: row.invoices.map((invoice) => ({ ...invoice, issueDate: invoice.issueDate?.toISOString() ?? null, total: invoice.total.toString(), paidTotal: invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2), payments: undefined })), files: row.files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })) };
  return <CustomerProfile initial={initial as never} companies={companies} />;
}
