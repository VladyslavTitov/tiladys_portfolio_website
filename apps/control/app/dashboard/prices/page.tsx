
import {ControlText} from '@/components/control-language';
import {CatalogueRates} from '@/components/catalogue-rates';
import {PrintEstimator} from '@/components/print-estimator';
import {requirePageUser} from '@/lib/page-user';
import { db } from '@tiladys/db';
import { PriceSpreadsheet } from './price-spreadsheet';

export default async function PricesPage() {
  await requirePageUser();
  const sections = await db.priceSection.findMany({
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  const data = sections.map((section) => ({
    id: section.id,
    updatedAt: section.updatedAt.toISOString(),
    number: section.number,
    title: section.title,
    subtitle: section.subtitle,
    sortOrder: section.sortOrder,
    active: section.active,
    items: section.items.map((item) => ({
      id: item.id,
      updatedAt: item.updatedAt.toISOString(),
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
      <h1><ControlText value={"Price table editor"}/></h1>
      <p className="admin-intro"><ControlText value={"Edit the complete price table in one place. Use the language tabs to maintain all six translations, then save all changes."}/></p>
      <PriceSpreadsheet initialSections={data} />
      <CatalogueRates sections={sections.map(s=>({id:s.id,label:`${s.number} · ${(s.title as Record<string,string>).de||''}`}))} items={sections.flatMap(s=>s.items.map(i=>({id:i.id,code:i.code,sectionId:i.sectionId,priceMode:i.priceMode,unitPrice:i.unitPrice?.toString()||null,unitTranslations:i.unitTranslations as Record<string,string>|null,unit:i.unit,currency:i.currency,updatedAt:i.updatedAt.toISOString(),name:i.name as Record<string,string>})))}/><PrintEstimator />
    </>
  );
}
