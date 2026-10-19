'use client';
import {ControlText} from '@/components/control-language';
/** In-page sections, not tabs: all fields stay mounted so drafts survive navigation. */
export function EditorSections({items}:{items:Array<{id:string;label:string}>}) {
  return <nav className="editor-section-nav" aria-label="Editor sections">{items.map(item=><a key={item.id} href={`#${item.id}`} onClick={()=>{let target=document.getElementById(item.id)?.closest('details');while(target){target.open=true;target=target.parentElement?.closest('details')??null;}}}><ControlText value={item.label}/></a>)}</nav>;
}
