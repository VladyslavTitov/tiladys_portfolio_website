'use client';

import {ControlText} from '@/components/control-language';
 
import Link from 'next/link';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
type Job={id:string;title:string;status:string;serviceType:string|null;jobNumber:string};
export function JobBoard({jobs,services}:{jobs:Job[];services:string[]}) {
 const params=useSearchParams();const [view,setView]=useState(params.get('view')==='BOARD'?'BOARD':'LIST');

 return <section className="panel"><div className="admin-page-actions"><div><button className="admin-secondary" aria-pressed={view==='LIST'} onClick={()=>setView('LIST')}><ControlText value={"List"}/></button><button className="admin-secondary" aria-pressed={view==='BOARD'} onClick={()=>setView('BOARD')}><ControlText value={"Board"}/></button></div><form action="/dashboard/service-jobs">{[...params.entries()].filter(([key])=>!['service','page','view'].includes(key)).map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}<input type="hidden" name="view" value={view}/><label><ControlText value={"Service filter"}/><select name="service" defaultValue={params.get('service')||''} onChange={e=>e.currentTarget.form?.requestSubmit()}><option value=""><ControlText value={"All services"}/></option>{services.map(s=><option key={s}>{s}</option>)}</select></label></form></div>{view==='LIST'?<p>{jobs.length}<ControlText value={" jobs on this page. The same filters apply to the list and board."}/></p>:<div className="job-board">{['PLANNED','IN_PROGRESS','WAITING_CUSTOMER','COMPLETED','CANCELLED'].map(status=><section key={status}><h3>{status.replaceAll('_',' ')}</h3>{jobs.filter(j=>j.status===status).map(j=><Link className="record-card" key={j.id} href={`/dashboard/service-jobs?jobId=${j.id}`}><strong>{j.title}</strong><small>{j.jobNumber}</small></Link>)}</section>)}</div>}<p><ControlText value={"Open a job to change its saved status; printing stages stay in the print brief."}/></p></section>;
}
