import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { priceBulkSchema, priceItemSchema } from '@tiladys/shared';
import { requireUser, assertOrigin } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const parsed = priceItemSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const row = await db.priceItem.create({ data: parsed.data });
    await db.auditLog.create({ data: { userId: user.id, action: 'PRICE_CREATE', entity: 'PriceItem', entityId: row.id } });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PRICE_CREATE_FAILED';
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : message === 'INVALID_ORIGIN' ? 403 : message === 'STALE_WRITE' ? 409 : 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const parsed = priceBulkSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const payload = parsed.data;
    
    const result = await db.$transaction(
  async (tx: Prisma.TransactionClient) => {
    // Lock catalogue rows in a stable order, including structured-rate edits.
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "PriceSection" ORDER BY "id" FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "PriceItem" ORDER BY "id" FOR UPDATE`);
    const currentSections = await tx.priceSection.findMany({ include: { items: true } });
    const versions = new Map(currentSections.flatMap(section => [[section.id, section.updatedAt.toISOString()], ...section.items.map(item => [item.id,item.updatedAt.toISOString()])] as [string,string][]));
    const check = (id: string, expected: string | undefined) => { if (!expected || versions.get(id) !== expected) throw Error('STALE_WRITE'); };
    for (const id of [...payload.deletedItemIds,...payload.deletedSectionIds]) check(id,payload.deletedVersions[id]);
    for (const section of payload.sections) {
      if(section.id) check(section.id,section.expectedUpdatedAt);
      for(const item of section.items) if(item.id) {
        check(item.id,item.expectedUpdatedAt);
        if(!section.id || !currentSections.find(s=>s.id===section.id)?.items.some(i=>i.id===item.id)) throw Error('INVALID_ITEM_RELATIONSHIP');
      }
    }
    if (payload.deletedItemIds.length) await tx.priceItem.updateMany({where:{id:{in:payload.deletedItemIds}},data:{active:false}});
    if (payload.deletedSectionIds.length) {
      await tx.priceItem.updateMany({where:{sectionId:{in:payload.deletedSectionIds}},data:{active:false}});
      await tx.priceSection.updateMany({where:{id:{in:payload.deletedSectionIds}},data:{active:false}});
    }

    for (const section of payload.sections) {
      const sectionData = {
        number: section.number,
        title: section.title,
        subtitle: section.subtitle,
        sortOrder: section.sortOrder,
        active: section.active,
      };

      const savedSection = section.id
        ? await tx.priceSection.update({
            where: { id: section.id },
            data: sectionData,
          })
        : await tx.priceSection.create({
            data: sectionData,
          });

      for (const item of section.items) {
        const itemData = {
          sectionId: savedSection.id,
          code: item.code,
          name: item.name,
          price: item.price,
          note: item.note,
          sortOrder: item.sortOrder,
          active: item.active,
        };

        if (item.id) {
          await tx.priceItem.update({
            where: { id: item.id },
            data: itemData,
          });
        } else {
          await tx.priceItem.create({
            data: itemData,
          });
        }
      }
    }

    return tx.priceSection.findMany({
      include: {
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });
  }, { timeout: 20000 }
);

    await db.auditLog.create({ data: { userId: user.id, action: 'PRICE_BULK_UPDATE', entity: 'PriceSection', metadata: { sections: payload.sections.length } } });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PRICE_SAVE_FAILED';
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : message === 'INVALID_ORIGIN' ? 403 : message === 'STALE_WRITE' ? 409 : 400 });
  }
}
