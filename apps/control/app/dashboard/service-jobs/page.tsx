import { db } from '@tiladys/db';
import { ServiceJobManager } from './service-job-manager';

export default async function ServiceJobsPage({ searchParams }: { searchParams: Promise<{ customerId?: string; jobId?: string }> }) {
  const query = await searchParams;
  const [jobs, customers, priceItems] = await Promise.all([
    db.serviceJob.findMany({ include: { files: { select: { id: true } } }, orderBy: [{ serviceDate: 'desc' }, { createdAt: 'desc' }], take: 100 }),
    db.customer.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, customerNumber: true, firstName: true, lastName: true, companyId: true, company: { select: { name: true } } }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
    db.priceItem.findMany({ where: { active: true }, select: { id: true, code: true, name: true }, orderBy: [{ section: { sortOrder: 'asc' } }, { sortOrder: 'asc' }] }),
  ]);
  const serialized = jobs.map((j) => ({ ...j, serviceDate: j.serviceDate?.toISOString() ?? null, startTime: j.startTime?.toISOString() ?? null, endTime: j.endTime?.toISOString() ?? null, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(), estimatedPrice: j.estimatedPrice?.toString() ?? null, finalPrice: j.finalPrice?.toString() ?? null, materialCost: j.materialCost?.toString() ?? null, otherCost: j.otherCost?.toString() ?? null }));
  return <><span className="eyebrow">Work</span><h1>Service jobs</h1><p className="admin-intro">Plan and document customer work, time, pricing and private notes.</p><ServiceJobManager initialJobs={serialized} customers={customers} priceItems={priceItems} initialCustomerId={query.customerId ?? ''} initialJobId={query.jobId ?? ''} /></>;
}
