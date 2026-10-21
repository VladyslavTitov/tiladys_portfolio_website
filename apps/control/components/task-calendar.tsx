'use client';
import {ControlText} from '@/components/control-language';

import {useSearchParams} from 'next/navigation';
type CalendarTask={id:string;title:string;dueAt:string|null;status:string};
export function TaskCalendar<T extends CalendarTask>({tasks,onSelect}:{tasks:T[];onSelect:(task:T)=>void}) {
 const params=useSearchParams();const raw=params.get('month');const month=raw&&/^\d{4}-\d{2}$/.test(raw)?raw:new Date().toISOString().slice(0,7);const start=new Date(`${month}-01T00:00:00Z`);const length=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();
 return <section aria-label={`Task calendar ${month}, UTC`}><h3>{month}<ControlText value={" · UTC dates"}/></h3><p><ControlText value={"All matching tasks in this month; open a task to review its saved timezone."}/></p><div className="task-calendar">{Array.from({length},(_,index)=>{const date=`${month}-${String(index+1).padStart(2,'0')}`;const items=tasks.filter(t=>t.dueAt?.slice(0,10)===date);return <article key={date}><h4><time dateTime={date}>{index+1} · {new Intl.DateTimeFormat('en',{timeZone:'UTC',weekday:'short'}).format(new Date(date))}</time></h4>{items.length?items.map(t=><button type="button" className="record-card" key={t.id} onClick={()=>onSelect(t)}>{t.title}<small>{t.dueAt?.slice(11,16)} UTC · {t.status}</small></button>):<small><ControlText value={"No tasks"}/></small>}</article>;})}</div></section>;
}
