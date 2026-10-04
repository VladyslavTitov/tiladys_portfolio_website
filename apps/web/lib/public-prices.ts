import { cache } from 'react';
import { db } from '@tiladys/db';
import type { PriceSection } from '@/components/PriceExplorer';
import fallback from '../../../packages/db/prisma/price-data.json';

function localized(value: unknown): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, string> : {};
}

// The public app already has a production database connection for the contact form.
// Read public prices from the same canonical database instead of crossing the
// deployment-protected Control boundary. Only active/public fields are selected.
export const getPublicPrices = cache(async (): Promise<PriceSection[]> => {
  try {
    const rows = await db.priceSection.findMany({
      where: { active: true },
      select: {
        id: true, number: true, title: true, subtitle: true,
        items: {
          where: { active: true },
          select: { id: true, code: true, name: true, price: true, note: true, active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((section) => ({
      id: section.id,
      number: section.number,
      title: localized(section.title),
      subtitle: localized(section.subtitle),
      items: section.items.map((item) => ({
        id: item.id,
        code: item.code,
        name: localized(item.name),
        price: item.price,
        note: localized(item.note),
        active: item.active,
      })),
    }));
  } catch {
    return fallback as PriceSection[];
  }
});
