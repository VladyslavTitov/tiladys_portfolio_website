import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, allocateNumber, parseCustomer } from '@/lib/business-records';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
    const status = req.nextUrl.searchParams.get('status');
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1);
    const take = 50;
    const where = {
      ...(status && ['LEAD', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status) ? { status: status as 'LEAD' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' } : {}),
      ...(q ? { OR: [
        { customerNumber: { contains: q, mode: 'insensitive' as const } },
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q, mode: 'insensitive' as const } },
        { company: { name: { contains: q, mode: 'insensitive' as const } } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      db.customer.findMany({ where, include: { company: { select: { id: true, name: true } }, _count: { select: { serviceJobs: true } } }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * take, take }),
      db.customer.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize: take });
  } catch (error) { const e = adminError(error, 'CUSTOMER_LIST_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function POST(req: NextRequest) {
  try {
    await assertOrigin(); const user = await requireUser(); const data = parseCustomer(await req.json());
    const row = await db.$transaction(async (tx) => {
      const customerNumber = await allocateNumber(tx, 'CUSTOMER', 'C');
      const customer = await tx.customer.create({ data: { ...data, customerNumber }, include: { company: true } });
      await tx.customerActivity.create({ data: { customerId: customer.id, type: 'CUSTOMER_CREATED', summary: 'Customer record created', createdById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CUSTOMER_CREATE', entity: 'Customer', entityId: customer.id } });
      return customer;
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) { const e = adminError(error, 'CUSTOMER_CREATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
