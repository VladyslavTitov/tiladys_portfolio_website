import type { Prisma } from "@prisma/client";
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
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : 400 });
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
    if (payload.deletedItemIds.length) {
      await tx.priceItem.deleteMany({
        where: {
          id: {
            in: payload.deletedItemIds,
          },
        },
      });
    }

    if (payload.deletedSectionIds.length) {
      await tx.priceSection.deleteMany({
        where: {
          id: {
            in: payload.deletedSectionIds,
          },
        },
      });
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
  }
);

    await db.auditLog.create({ data: { userId: user.id, action: 'PRICE_BULK_UPDATE', entity: 'PriceSection', metadata: { sections: payload.sections.length } } });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PRICE_SAVE_FAILED';
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' ? 401 : 400 });
  }
}
