import Image from 'next/image';
import type { ServiceDefinition } from '@/lib/services';

export function ServiceVisual({ service, title, image = service.image, compact = false, priority = false }: { service: ServiceDefinition; title: string; image?: string; compact?: boolean; priority?: boolean }) {
  return (
    <div className={`service-visual ${compact ? 'service-visual--compact' : 'hero-visual'} ${image.includes('/hero/') ? 'service-visual--panorama' : ''}`}>
      <Image src={image} alt={title} fill sizes={compact ? '(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw' : '(max-width: 768px) 100vw, 50vw'} priority={priority} />
    </div>
  );
}
