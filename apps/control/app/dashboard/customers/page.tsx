
import {ControlText} from '@/components/control-language';
import Link from 'next/link';
import {requirePageUser} from '@/lib/page-user';
import {db,Prisma} from '@tiladys/db';
import {CustomerManager} from './customer-manager';
export default async function CustomersPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;type?:string;page?:string;new?:string}>}) {
 await requirePageUser();const query=await searchParams;const page=Math.min(10000,Math.max(1,Math.floor(Number(query.page))||1)),q=(query.q||'').trim().slice(0,100);
 const where:Prisma.CustomerWhereInput={...(['PERSON','BUSINESS'].includes(query.type||'')?{type:query.type as 'PERSON'}:{}),...(['LEAD','ACTIVE','INACTIVE','ARCHIVED'].includes(query.status||'')?{status:query.status as 'LEAD'}:{}),...(q?{OR:[{customerNumber:{contains:q,mode:'insensitive'}},{firstName:{contains:q,mode:'insensitive'}},{lastName:{contains:q,mode:'insensitive'}},{email:{contains:q,mode:'insensitive'}},{phone:{contains:q,mode:'insensitive'}},{company:{name:{contains:q,mode:'insensitive'}}}]}:{})};
 const [customers,companies,total]=await Promise.all([db.customer.findMany({where,include:{company:{select:{id:true,name:true}},_count:{select:{serviceJobs:true}}},orderBy:{updatedAt:'desc'},take:50,skip:(page-1)*50}),db.company.findMany({select:{id:true,name:true},orderBy:{name:'asc'}}),db.customer.count({where})]);
 const href=(next:number)=>`?${new URLSearchParams({q,status:query.status||'',type:query.type||'',page:String(next)})}`;
 return <><div className="admin-title"><div><span className="eyebrow">CRM</span><h1><ControlText value={"Customers"}/></h1><p className="admin-intro"><ControlText value={"Canonical customer records, contact details and service history."}/></p></div></div><CustomerManager key={JSON.stringify(query)} initialQuery={query} initialCustomers={customers.map(c=>({...c,updatedAt:c.updatedAt.toISOString()}))} companies={companies}/><nav className="record-pagination" aria-label="Client pages">{page>1?<Link href={href(page-1)}><ControlText value={"Previous"}/></Link>:null}<span>{page} · {total}<ControlText value={" clients"}/></span>{page*50<total?<Link href={href(page+1)}><ControlText value={"Next"}/></Link>:null}</nav></>;
}
