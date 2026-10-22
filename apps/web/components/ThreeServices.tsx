import Link from 'next/link';
import { ArrowRight, Box, Monitor, Wrench } from 'lucide-react';
import { rebuildCopy } from '@/lib/rebuild-copy';
import { serviceById, serviceCopy } from '@/lib/services';
import { ServiceVisual } from './services/ServiceVisual';
export function ThreeServices({ locale }: { locale: string }) {
  const c = rebuildCopy(locale);
  return <section className="section rebuild-services"><h2>{c.services}</h2><div className="rebuild-grid">
    {(['websites', '3d-printing', 'pc-laptop'] as const).map((id, index) => { const copy = serviceCopy(id, locale); const Icon = [Monitor, Box, Wrench][index]; return <article className="rebuild-card" key={id}>
      <ServiceVisual service={serviceById[id]} title={copy.title} compact />
      <div><span className="rebuild-icon"><Icon aria-hidden="true" /></span><h3>{[c.websites, c.printing, c.pc][index]}</h3><p>{copy.short}</p><Link className="primary" href={`/${locale}/services/${id}`}>{copy.title}<ArrowRight aria-hidden="true" size={18} /></Link></div>
    </article>; })}
  </div></section>;
}
export function ProductPathways({ locale }: { locale: string }) {
 const c = rebuildCopy(locale);
 return <section className="section rebuild-pathways"><article><Monitor aria-hidden="true" /><h2>{c.templates}</h2><Link className="primary" href={`/${locale}/products/framer`}>{c.browse}<ArrowRight aria-hidden="true" size={18} /></Link></article><article><Box aria-hidden="true" /><h2>{c.models}</h2><Link className="primary" href={`/${locale}/products/3d-models`}>{c.browse}<ArrowRight aria-hidden="true" size={18} /></Link></article></section>;
}
