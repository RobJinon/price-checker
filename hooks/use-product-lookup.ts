import { useCallback, useRef, useState } from 'react';

import {
  fetchOffProductByBarcode,
  NormalizedOffProduct,
} from '@/services/openFoodFacts';

export type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

export function useProductLookup() {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const lookupBarcode = useCallback(
    async (barcode: string): Promise<NormalizedOffProduct | null> => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLookupStatus('loading');

      try {
        const result = await fetchOffProductByBarcode(barcode, controller.signal);
        if (controller.signal.aborted) return null;
        setLookupStatus(result ? 'found' : 'not-found');
        return result;
      } catch {
        if (!controller.signal.aborted) {
          setLookupStatus('error');
        }
        return null;
      }
    },
    []
  );

  return { lookupStatus, lookupBarcode };
}