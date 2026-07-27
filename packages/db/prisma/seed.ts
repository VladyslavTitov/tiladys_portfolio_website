import { PrismaClient } from '@prisma/client';
import data from './price-data.json' with { type: 'json' };

const db = new PrismaClient();

for (const section of data) {
  const existing = await db.priceSection.findFirst({ where: { number: section.number } });
  const sectionData = {
    number: section.number,
    title: section.title,
    subtitle: section.subtitle,
    sortOrder: section.sortOrder,
    active: true,
  };
  const saved = existing
    ? await db.priceSection.update({ where: { id: existing.id }, data: sectionData })
    : await db.priceSection.create({ data: sectionData });

  for (const item of section.items) {
    await db.priceItem.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        price: item.price,
        note: item.note,
        sortOrder: item.sortOrder,
        sectionId: saved.id,
        active: true,
      },
      create: { ...item, active: true, sectionId: saved.id },
    });
  }
}

console.log(`Seeded ${data.length} price sections and ${data.flatMap((section) => section.items).length} services.`);
await db.$disconnect();
