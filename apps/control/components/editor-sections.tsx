import {ControlText} from '@/components/control-language';
/** In-page sections, not tabs: all fields stay mounted so drafts survive navigation. */
export function EditorSections({items}:{items:Array<{id:string;label:string}>}) {
  return <nav className="editor-section-nav" aria-label="Editor sections">{items.map(item=><a key={item.id} href={`#${item.id}`}><ControlText value={item.label}/></a>)}</nav>;
}
