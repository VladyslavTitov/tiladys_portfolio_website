
import {ControlText} from '@/components/control-language';
import {requirePageUser} from '@/lib/page-user';
import { db } from '@tiladys/db';
import { MessageList } from './message-list';

export default async function MessagesPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;page?:string;messageId?:string}>}) {
  await requirePageUser();
  const query=await searchParams; const page=Math.min(10000,Math.max(1,Number(query.page)||1));const q=(query.q||'').slice(0,120);const status=['UNREAD','READ','REPLIED','ARCHIVED','SPAM'].includes(query.status||'')?query.status as 'UNREAD'|'READ'|'REPLIED'|'ARCHIVED'|'SPAM':undefined;
  const where={...(status?{status}:{}),...(query.messageId?{id:query.messageId}:{}),...(q?{OR:[{name:{contains:q,mode:'insensitive' as const}},{email:{contains:q,mode:'insensitive' as const}},{message:{contains:q,mode:'insensitive' as const}}]}:{})};
  const total=await db.contactMessage.count({where});
  const rows = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    where, take:25,skip:(page-1)*25,
    select: { attachments: { select: { id: true, filename: true, size: true, width: true, height: true } }, id: true, name: true, email: true, service: true, requestMode:true, replyLanguage:true, phone:true, publicReference:true, locale: true, message: true, status: true, createdAt: true },
  });

  return (
    <>
      <h1><ControlText value={"Customer messages"}/></h1>
      <p className="admin-intro"><ControlText value={"Contact requests remain in their original language. Open a message to read its complete plain-text content."}/></p>
      <form className="record-search"><label><ControlText value={"Search"}/><input name="q" defaultValue={q}/></label><label><ControlText value={"Status"}/><select name="status" defaultValue={status||''}><option value=""><ControlText value={"All"}/></option>{['UNREAD','READ','REPLIED','ARCHIVED','SPAM'].map(s=><option key={s}>{s}</option>)}</select></label><button className="admin-secondary"><ControlText value={"Apply filters"}/></button></form>
      <MessageList initialDetailOpen={Boolean(query.messageId)} messages={rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))} />
      <nav className="record-pagination" aria-label="Pages">{page>1?<a className="admin-secondary" href={`?page=${page-1}&q=${encodeURIComponent(q)}&status=${status||''}`}><ControlText value={"Previous"}/></a>:null}<span>{page} · {total}<ControlText value={" enquiries"}/></span>{page*25<total?<a className="admin-secondary" href={`?page=${page+1}&q=${encodeURIComponent(q)}&status=${status||''}`}><ControlText value={"Next"}/></a>:null}</nav>
    </>
  );
}
