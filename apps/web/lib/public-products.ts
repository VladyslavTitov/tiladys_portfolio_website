import { db, Prisma } from '@tiladys/db';
import { locales } from '@tiladys/shared';
const select = { slug:true,type:true,title:true,description:true,included:true,license:true,price:true,currency:true,priceConfirmed:true,available:true,demoUrl:true,purchaseUrl:true,updatedAt:true,images:{select:{id:true,alt:true,sortOrder:true},orderBy:{sortOrder:'asc' as const}} } satisfies Prisma.ProductSelect;
export type PublicProduct = Prisma.ProductGetPayload<{select:typeof select}>;
export function productText(value: Prisma.JsonValue,locale:string) { return value && typeof value==='object'&&!Array.isArray(value)&&typeof value[locale]==='string'?value[locale] as string:''; }
export function productLocales(product: Pick<PublicProduct,'title'|'description'|'included'|'license'>) { return locales.filter(l=>['title','description','included','license'].every(key=>productText(product[key as 'title'],l).trim())); }
export async function publishedProducts(type?:'FRAMER_TEMPLATE'|'MODEL_3D',locale?:string,page=1,q='') {
 const language=locales.includes(locale as never)?locale!:'en';const currentPage=Math.min(10000,Math.max(1,Math.floor(page)||1));
 const terms=[Prisma.sql`status='PUBLISHED' AND "rightsConfirmed"=true`];if(type)terms.push(Prisma.sql`type::text=${type}`);
 for(const field of ['title','description','included','license'])terms.push(Prisma.sql`length(btrim(COALESCE(${Prisma.raw('"'+field+'"')}->>${language},'')))>0`);
 if(q){const pattern=`%${q.slice(0,120).replace(/[\\%_]/g,'\\$&')}%`;terms.push(Prisma.sql`(slug ILIKE ${pattern} OR "title"->>${language} ILIKE ${pattern} OR "description"->>${language} ILIKE ${pattern})`);}
 const where=Prisma.join(terms,' AND ');const [ids,counts]=await Promise.all([db.$queryRaw<Array<{id:string;slug:string}>>(Prisma.sql`SELECT id,slug FROM "Product" WHERE ${where} ORDER BY "sortOrder" ASC,"updatedAt" DESC,id ASC LIMIT 12 OFFSET ${(currentPage-1)*12}`),db.$queryRaw<Array<{total:bigint}>>(Prisma.sql`SELECT COUNT(*) AS total FROM "Product" WHERE ${where}`)]);
 const rows=await db.product.findMany({where:{status:'PUBLISHED',rightsConfirmed:true,id:{in:ids.map(i=>i.id)}},select});return {items:ids.flatMap(id=>{const row=rows.find(r=>r.slug===id.slug);return row?[row]:[];}),total:Number(counts[0].total)};

}
export async function publishedProductSitemap(){return db.product.findMany({where:{status:'PUBLISHED',rightsConfirmed:true},select:{slug:true,title:true,description:true,included:true,license:true,updatedAt:true}});}
export async function publishedProduct(slug:string) { return db.product.findFirst({where:{status:'PUBLISHED',rightsConfirmed:true,OR:[{slug},{aliases:{some:{slug}}}]},select}); }
