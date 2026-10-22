import { cardImageSizes } from '@/lib/image-sizes';
import Link from 'next/link';
import { ProjectImage } from '@/components/ProjectImage';
import { publishedProducts, productText } from '@/lib/public-products';
import { rebuildCopy } from '@/lib/rebuild-copy';

export async function PublishedProducts({ locale, type }: { locale: string; type: 'FRAMER_TEMPLATE' | 'MODEL_3D' }) {
  const copy = rebuildCopy(locale);
  const catalogue = type === 'FRAMER_TEMPLATE' ? 'framer' : '3d-models';
  let result;
  try { result = await publishedProducts(type, locale); }
  catch { return <section className="section"><p role="alert">{copy.unavailable}</p><Link href={`/${locale}/products/${catalogue}`}>{copy.browse}</Link></section>; }
  return <section className="section">
    <h2>{type === 'FRAMER_TEMPLATE' ? copy.templates : copy.models}</h2>
    {result.items.length ? <div className="rebuild-grid">{result.items.slice(0, 3).map(product => <article className="rebuild-card" key={product.slug}>
      {product.images[0] ? <ProjectImage src={`/api/public/product-media/${product.images[0].id}`} alt={productText(product.images[0].alt, locale)} sizes={cardImageSizes} /> : null}
      <div><h3><Link href={`/${locale}/products/${product.slug}`}>{productText(product.title, locale)}</Link></h3><p>{productText(product.description, locale)}</p><div className="actions">
        {product.demoUrl ? <a className="secondary" href={product.demoUrl} target="_blank" rel="noopener noreferrer">{copy.preview} ↗</a> : null}
        {product.available && product.priceConfirmed && product.purchaseUrl ? <a className="secondary" href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">{copy.purchase} ↗</a> : null}
      </div></div>
    </article>)}</div> : <p>{copy.empty}</p>}
    <p><Link className="secondary" href={`/${locale}/products/${catalogue}`}>{copy.browse}</Link></p>
  </section>;
}
