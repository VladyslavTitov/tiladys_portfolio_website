import { adminDateTime } from '@/lib/admin-dates';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@tiladys/db';
import { invoiceInclude, serializeInvoice } from '@/lib/invoices';
import { ProfileInvoices } from '../../invoices/profile-invoices';
import { CompanyEditor } from './company-editor';

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await db.company.findUnique({ where: { id }, include: {
    customers: { orderBy: { lastName: 'asc' } }, serviceJobs: { orderBy: { createdAt: 'desc' } },
    invoices: { include: invoiceInclude, orderBy: { createdAt: 'desc' } },
  } });
  if (!company) notFound();
  const activity = await db.auditLog.findMany({ where: { OR: [
    { entity: 'Company', entityId: id },
    { entity: 'Invoice', entityId: { in: company.invoices.map(i => i.id) } },
    { entity: 'ServiceJob', entityId: { in: company.serviceJobs.map(j => j.id) } },
  ] }, orderBy: { createdAt: 'desc' }, take: 100 });
  const { customers, serviceJobs, invoices } = company;
  const details = { id: company.id, name: company.name, email: company.email, phone: company.phone, street: company.street, postalCode: company.postalCode, city: company.city, country: company.country, website: company.website, notes: company.notes };
  return <><p><Link href="/dashboard/companies">← Companies</Link></p><span className="eyebrow">Company</span><h1>{company.name}</h1>
    <CompanyEditor initial={details} />
    <div className="profile-layout"><section className="panel"><h2>Contacts</h2>{customers.length ? <div className="compact-list">{customers.map(c => <Link key={c.id} href={`/dashboard/customers/${c.id}`}><strong>{[c.firstName, c.lastName].filter(Boolean).join(' ') || c.customerNumber}</strong><span>{c.customerNumber} · {c.status}</span></Link>)}</div> : <p>No contacts yet. <Link href="/dashboard/customers">Add a customer and select this company.</Link></p>}</section>
    <section className="panel"><h2>Service jobs</h2>{serviceJobs.length ? <div className="compact-list">{serviceJobs.map(j => <Link key={j.id} href={`/dashboard/service-jobs?jobId=${j.id}`}><strong>{j.title}</strong><span>{j.jobNumber} · {j.status}</span><span>Create invoice from job →</span></Link>)}</div> : <p>No service jobs yet. Open a contact to create a job.</p>}</section></div>
    <ProfileInvoices invoices={invoices.map(serializeInvoice) as never} />
    <section className="panel"><h2>Activity history</h2>{activity.length ? <div className="timeline">{activity.map(a => <article key={a.id}><strong>{a.action.replaceAll('_', ' ')}</strong><small>{adminDateTime(a.createdAt)}</small></article>)}</div> : <p>No activity recorded yet.</p>}</section>
  </>;
}
