import { cache } from 'react';
import type { PriceSection } from '@/components/PriceExplorer';
import { api } from './api';
import fallback from '../../../packages/db/prisma/price-data.json';

// React cache deduplicates calls within one render. Next's 60-second data cache
// avoids a control-API round trip on every Services navigation while keeping
// public prices close to the current Control value.
export const getPublicPrices = cache(async (): Promise<PriceSection[]> => {
  try {
    return await api<PriceSection[]>('/api/public/prices', { next: { revalidate: 60 } });
  } catch {
    return fallback as PriceSection[];
  }
});
