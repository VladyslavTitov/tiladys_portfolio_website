import type { PriceSection } from '@/components/PriceExplorer';
import { priceLabel, ui, type ServiceDefinition } from '@/lib/services';
import { localizedPrice } from '@/lib/price-format';

function findPrice(sections: PriceSection[], code: string) {
  return sections.flatMap((section) => section.items).find((item) => item.code === code)?.price;
}

export function ServicePrice({ service, sections, locale, disclaimer = false, primaryOnly = false }: { service: ServiceDefinition; sections: PriceSection[]; locale: string; disclaimer?: boolean; primaryOnly?: boolean }) {
  const copy = ui(locale);
  return (
    <div className="service-price-block">
      <div className={`service-prices${service.priceRefs.length > 1 ? ' service-prices--multiple' : ''}`}>
        {(primaryOnly ? service.priceRefs.slice(0, 1) : service.priceRefs).map((ref) => {
          const price = findPrice(sections, ref.code);
          return (
            <div className="service-price" key={ref.code}>
              <span>{priceLabel(ref, locale)}</span>
              <strong>{price ? `${copy.from} ${localizedPrice(price.replace(/^от /, ''), locale)}` : copy.pricingUnavailable}</strong>
            </div>
          );
        })}
      </div>
      {disclaimer ? <p className="service-price-disclaimer">{copy.disclaimer}</p> : null}
    </div>
  );
}
