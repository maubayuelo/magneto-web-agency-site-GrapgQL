// Custom React hook for Calendly integration
// src/lib/hooks/useCalendly.ts

// Calendly integration hook
// This is a client-side hook (note the 'use client' directive) because it
// interacts with a third-party script and the browser DOM.
'use client';

import { useState, useCallback } from 'react';
import { openCalendlyPopup, loadCalendlyScript, warmCalendlyResources } from '@/utils/calendly';

// Options you can pass when opening Calendly. For example, UTM params or callbacks.
export interface UseCalendlyOptions {
  utmContent?: string;
  utmTerm?: string;
  customUrl?: string;
  /** If true, open Calendly in a new tab/window (avoid embedded iframe). */
  forceNewWindow?: boolean;
  onOpen?: () => void;
  onError?: (error: Error) => void;
}

export interface UseCalendlyReturn {
  openCalendly: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isScriptLoaded: boolean;
  preload: () => void;
  /** Explicitly load the Calendly script */
  load: () => Promise<void> | void;
}

export function useCalendly(options: UseCalendlyOptions = {}): UseCalendlyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  /**
   * openCalendly
   * - Ensures the Calendly embed script is loaded, then opens the popup.
   * - Errors are saved in state and passed to optional callbacks for consumer components.
   */
  const openCalendly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load script if not already loaded
      if (!isScriptLoaded) {
        await loadCalendlyScript();
        setIsScriptLoaded(true);
      }

      // Optional hook for calling code to react when Calendly opens
      if (options.onOpen) {
        options.onOpen();
      }

      // Open Calendly popup; openCalendlyPopup is a small helper that wraps the Calendly API.
      await openCalendlyPopup({
        utmContent: options.utmContent,
        utmTerm: options.utmTerm,
        customUrl: options.customUrl,
        forceNewWindow: options.forceNewWindow
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

  const preload = () => {
    // Lightweight warm-up on user intent (hover/focus). This avoids executing
    // the full Calendly script but preconnects and preloads assets to speed up
    // an eventual full load. Consumers can still call `load` to explicitly
    // load the script ahead of time.
    try {
      warmCalendlyResources();
    } catch (e) {
      // swallow
    }
  };

  const load = () => {
    // Explicit API to load the full Calendly script (returns a promise)
    try {
      return loadCalendlyScript().then(() => setIsScriptLoaded(true)).catch(() => {});
    } catch (e) {
      return Promise.resolve();
    }
  };

  return {
    openCalendly,
    isLoading,
    error,
    isScriptLoaded
    ,preload,
    load
  };
}
