'use client';
import {CustomerSelect} from './customer-select';
import {ControlText} from '@/components/control-language';

import Link from 'next/link';
import {useRef,useState} from 'react';
export function NewInvoice() {
 const [customerId,setCustomerId]=useState(''),[pending,setPending]=useState(false),[feedback,setFeedback]=useState(''),[id,setId]=useState('');
 const attempt=useRef<{customerId:string;key:string}|null>(null);
 async function create(e:React.FormEvent){e.preventDefault();if(pending)return;setPending(true);setId('');if(attempt.current?.customerId!==customerId)attempt.current={customerId,key:crypto.randomUUID()};try{const r=await fetch('/api/admin/invoices',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.current.key},body:JSON.stringify({kind:'STANDALONE',customerId})});const row=await r.json();if(!r.ok)throw Error(row.error||'Draft creation failed.');setId(row.id);setFeedback('Empty private draft created. Add reviewed services before preview or issuance.');}catch(e){setFeedback((e as Error).message);}finally{setPending(false);}}
 return <form className="panel record-search" onSubmit={create}><CustomerSelect required label="Client for new empty invoice" value={customerId} onChange={setCustomerId}/><button className="admin-secondary" disabled={pending||!customerId}><ControlText value={pending?'Creating…':'Create empty draft'}/></button>{id?<><button type="button" className="admin-secondary" onClick={()=>{attempt.current=null;setId('');setFeedback('Choose the client for a new draft.');}}><ControlText value={"Prepare another draft"}/></button><Link className="admin-primary" href={`/dashboard/invoices?invoiceId=${id}`}><ControlText value={"Open draft"}/></Link></>:null}<p role="status">{feedback}</p></form>;
}
