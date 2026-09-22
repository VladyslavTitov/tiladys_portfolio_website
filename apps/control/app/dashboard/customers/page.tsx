import { db } from '@tiladys/db';
import { CustomerManager } from './customer-manager';

export default async function CustomersPage() {
  const [customers, companies] = await Promise.all([
    db.customer.findMany({ include: { company: { select: { id: true, name: true } }, _count: { select: { serviceJobs: true } } }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return <><div className="admin-title"><div><span className="eyebrow">CRM</span><h1>Customers</h1><p className="admin-intro">Canonical customer records, contact details and service history.</p></div></div><CustomerManager initialCustomers={customers.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))} companies={companies} /></>;
}
