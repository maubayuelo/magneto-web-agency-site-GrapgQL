// Custom React hook for Calendly integration
// src/lib/hooks/useCalendly.ts

'use client';

import { useState, useCallback } from 'react';
import { openCalendlyPopup, loadCalendlyScript } from '../utils/calendly';

export interface UseCalendlyOptions {
  utmContent?: string;
  utmTerm?: string;
  customUrl?: string;
  onOpen?: () => void;
  onError?: (error: Error) => void;
}

export interface UseCalendlyReturn {
  openCalendly: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isScriptLoaded: boolean;
}

export function useCalendly(options: UseCalendlyOptions = {}): UseCalendlyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const openCalendly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load script if not already loaded
      if (!isScriptLoaded) {
        await loadCalendlyScript();
        setIsScriptLoaded(true);
      }

      // Call onOpen callback
      if (options.onOpen) {
        options.onOpen();
      }

      // Open Calendly popup
      await openCalendlyPopup({
        utmContent: options.utmContent,
        utmTerm: options.utmTerm,
        customUrl: options.customUrl
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open Calendly';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  }, [options, isScriptLoaded]);

  return {
    openCalendly,
    isLoading,
    error,
    isScriptLoaded
  };
}
