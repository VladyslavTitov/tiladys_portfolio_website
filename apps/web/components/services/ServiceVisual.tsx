import { cardImageSizes, relatedImageSizes } from '@/lib/image-sizes';
import Image from 'next/image';
import type { ServiceDefinition } from '@/lib/services';

export function ServiceVisual({ service, title, image = service.image, compact = false, thumbnail = false, priority = false }: { service: ServiceDefinition; title: string; image?: string; compact?: boolean; thumbnail?: boolean; priority?: boolean }) {
  if (service.id === '3d-printing') image='/illustrations/g03-practical-prints-1600.webp';
  return (
    <div className={`service-visual ${compact ? 'service-visual--compact' : 'hero-visual'} ${service.id === '3d-printing' ? 'service-visual--render' : 'service-visual--photo'}`}>
      <Image src={image} alt={title} fill sizes={thumbnail ? relatedImageSizes : compact ? cardImageSizes : '(max-width: 640px) calc(100vw - 84px), (max-width: 900px) 560px, (max-width: 1248px) 40vw, 440px'} priority={priority} />
    </div>
  );
}
