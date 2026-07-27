import { db } from '@tiladys/db';
import { PriceSpreadsheet } from './price-spreadsheet';

export default async function PricesPage() {
  const sections = await db.priceSection.findMany({
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  const data = sections.map((section) => ({
    id: section.id,
    number: section.number,
    title: section.title,
    subtitle: section.subtitle,
    sortOrder: section.sortOrder,
    active: section.active,
    items: section.items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      price: item.price,
      note: item.note,
      sortOrder: item.sortOrder,
      active: item.active,
    })),
  }));

  return (
    <>
      <h1>Price table editor</h1>
      <p className="admin-intro">Edit the complete price table in one place. Use the language tabs to maintain all six translations, then save all changes.</p>
      <PriceSpreadsheet initialSections={data} />
    </>
  );
}
