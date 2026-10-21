'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {ControlText} from './control-language';
export function QuickTaskComplete({id,revision}:{id:string;revision:number}){const [pending,setPending]=useState(false),[feedback,setFeedback]=useState('');const router=useRouter();async function complete(){setPending(true);try{const r=await fetch(`/api/admin/tasks/${id}/complete`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision})});if(!r.ok)throw Error(r.status===409?'Task changed. Open it to review.':'Task could not be completed.');setFeedback('Completed');router.refresh();}catch(e){setFeedback((e as Error).message);}finally{setPending(false);}}return <div><button type="button" className="admin-secondary" disabled={pending} onClick={complete}><ControlText value={pending?'Saving…':'Complete task'}/></button><span role="status">{feedback}</span></div>;}
