
import {ControlText} from '@/components/control-language';
import {requirePageUser} from '@/lib/page-user';
import { db } from '@tiladys/db';import { CompanyManager } from './company-manager';
export default async function CompaniesPage(){
  await requirePageUser();const rows=await db.company.findMany({include:{_count:{select:{customers:true,serviceJobs:true}}},orderBy:{name:'asc'}});return <><span className="eyebrow">CRM</span><h1><ControlText value={"Companies"}/></h1><p className="admin-intro"><ControlText value={"Company records shared by customer contacts and service jobs."}/></p><CompanyManager initial={rows}/></>}
