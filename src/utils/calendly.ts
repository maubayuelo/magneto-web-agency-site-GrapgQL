// Calendly integration utilities
// src/lib/calendly.ts

declare global {
  interface Window {
    Calendly: {
      initPopupWidget: (options: CalendlyPopupOptions) => void;
      initBadgeWidget: (options: CalendlyBadgeOptions) => void;
      closePopupWidget: () => void;
    };
  }
}

export interface CalendlyPopupOptions {
  url: string;
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

export interface CalendlyBadgeOptions {
  url: string;
  text: string;
  color: string;
  textColor: string;
  branding?: boolean;
}

export interface CalendlyConfig {
  // Replace with your actual Calendly URL
  url: string;
  // UTM tracking parameters
  defaultUtm: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
  };
  /** If true, prefer opening Calendly in a new tab/window (avoids embedding via iframe). */
  preferNewWindow?: boolean;
}

// Calendly configuration - UPDATE THIS WITH YOUR ACTUAL CALENDLY URL
export const calendlyConfig: CalendlyConfig = {
  url: 'https://calendly.com/mauriciobayuelo/free-discovery-call', // Replace with your actual Calendly URL
  defaultUtm: {
    utmSource: 'website',
    utmMedium: 'cta',
    utmCampaign: 'strategy_call'
  }
  ,
  // Default to opening via the embedded popup/modal widget. Consumers can override by
  // passing `forceNewWindow: true` to `openCalendlyPopup` or the CalendlyButton.
  // Historically (2025-09-19) the CTA opened Calendly inside an on-page modal. Use
  // an embedded modal by default to avoid opening blank new tabs.
  preferNewWindow: false
};

/**
 * Load Calendly widget script dynamically
 */
export const CALENDLY_CSS = 'https://assets.calendly.com/assets/external/widget.css';
export const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';

// Module-level singleton promise so multiple callers can await the same load.
let _loadPromise: Promise<void> | null = null;
export const loadCalendlyScript = (): Promise<void> => {
  // If Calendly is already present, return resolved promise
  if (typeof window !== 'undefined' && (window as any).Calendly) {
    return Promise.resolve();
  }

  // Return existing promise if load already started
  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise<void>((resolve, reject) => {
    try {
      // If script tag already exists, wait for Calendly global to appear
      const existing = document.querySelector(`script[src="${CALENDLY_SCRIPT}"]`);
      if (existing) {
        const check = () => {
          if ((window as any).Calendly) resolve();
          else setTimeout(check, 100);
        };
        check();
        return;
      }

      // Load CSS (best-effort; allow browser to cache)
  const link = document.createElement('link');
  link.href = CALENDLY_CSS;
  link.rel = 'stylesheet';
  // Explicitly set crossorigin so browser can match credentials mode with preloads
  // and reuse the fetched resource when the script/style is later used.
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

      // Create script but do not execute immediately where possible; mark as defer
  const script = document.createElement('script');
  script.src = CALENDLY_SCRIPT;
  script.async = true;
  // set defer as a hint that execution can be deferred until parser is idle
  // note: for dynamically inserted scripts, defer has no effect in some browsers,
  // but async=true keeps it non-blocking. We maintain idempotency via _loadPromise.
  script.defer = true;
  // Ensure the credentials mode matches preloaded resources so the browser
  // will reuse the preload instead of discarding it.
  script.crossOrigin = 'anonymous';

      script.onload = () => {
        // Small grace period for the Calendly global to initialize
        setTimeout(() => {
          if ((window as any).Calendly) resolve();
          else reject(new Error('Calendly failed to initialize'));
        }, 100);
      };

      script.onerror = () => reject(new Error('Failed to load Calendly script'));

      // Append as late as possible; callers control when to call this loader.
      document.head.appendChild(script);
    } catch (err) {
      reject(err);
    }
  })
    .catch((err) => {
      // Reset promise so future attempts can retry
      _loadPromise = null;
      throw err;
    });

  return _loadPromise!;
};

// Lightweight warm-up: preconnect + preload Calendly assets on user intent (hover/focus)
let _calendlyWarmed = false;
export const warmCalendlyResources = (): void => {
  try {
    if (typeof document === 'undefined' || _calendlyWarmed) return;
    _calendlyWarmed = true;

    const origins = ['https://assets.calendly.com', 'https://calendly.com'];
    origins.forEach((href) => {
      // preconnect helps reduce DNS/TCP/SSL overhead
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = href;
      // use anonymous to match the script/style crossOrigin, avoiding credential mismatches
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);

      // dns-prefetch as a graceful fallback for older browsers
      const dns = document.createElement('link');
      dns.rel = 'dns-prefetch';
      dns.href = href;
      document.head.appendChild(dns);
    });

    // Avoid preloading CSS/JS to prevent browser warnings when users don't
    // open Calendly shortly after load. Keep only preconnect/dns-prefetch.
  } catch (e) {
    // swallow - warm-up should never throw
  }
};

/**
 * Open Calendly popup with tracking
 */
export const openCalendlyPopup = async (options?: {
  utmContent?: string;
  utmTerm?: string;
  customUrl?: string;
  /** If true, open Calendly in a new browser tab/window instead of using the embedded popup widget. */
  forceNewWindow?: boolean;
  /** Optional map of utm_* params to append to the Calendly URL */
  utmParams?: Record<string, string | undefined>;
}) => {
  try {
    // If caller prefers a new window (avoids iframe/permission policies), open immediately
    const targetUrl = new URL(options?.customUrl || calendlyConfig.url);
    targetUrl.searchParams.set('utm_source', calendlyConfig.defaultUtm.utmSource);
    targetUrl.searchParams.set('utm_medium', calendlyConfig.defaultUtm.utmMedium);
    targetUrl.searchParams.set('utm_campaign', calendlyConfig.defaultUtm.utmCampaign);
    if (options?.utmContent) targetUrl.searchParams.set('utm_content', options.utmContent);
    if (options?.utmTerm) targetUrl.searchParams.set('utm_term', options.utmTerm);

    // Append any explicit utm params provided by the caller (these override defaults)
    if (options?.utmParams) {
      Object.entries(options.utmParams).forEach(([k, v]) => {
        if (v) targetUrl.searchParams.set(k, v);
      });
    }

    const useNewWindow = options?.forceNewWindow ?? calendlyConfig.preferNewWindow;

    if (useNewWindow) {
      // If caller explicitly requests a new window, open it (legacy behavior).
      window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer');
      // Track event (if analytics available)
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
        gtag('event', 'calendly_popup_opened', {
          event_category: 'engagement',
          event_label: options?.utmContent || 'strategy_call',
          method: 'new_tab'
        });
      }
      return;
    }

    // Prefer an in-page embedded experience. First try the Calendly popup widget
    // (the official script) for the consistent behavior. If that's not available
    // fall back to rendering an iframe inside a custom modal overlay so we never
    // open a blank browser tab.
    await loadCalendlyScript();

    if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function') {
      try {
        window.Calendly.initPopupWidget({ url: targetUrl.toString() });
        if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
          const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
          gtag('event', 'calendly_popup_opened', {
            event_category: 'engagement',
            event_label: options?.utmContent || 'strategy_call',
            method: 'popup_widget'
          });
        }
        return;
      } catch (err) {
        // if the script failed to open its own popup, we'll fall through to iframe modal
      }
    }

    // Final fallback: create an in-page iframe modal so the user stays on the site
    openEmbeddedCalendlyModal(targetUrl.toString(), options?.utmContent);
  } catch (error) {
    // Avoid noisy errors in console; log only in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error opening Calendly popup:', error);
    }
    // Final fallback: prefer showing an in-page embedded modal so we don't
    // navigate users away from the site. Only open a new tab/window when the
    // caller explicitly requested `forceNewWindow: true`.
    try {
      openEmbeddedCalendlyModal(calendlyConfig.url, options?.utmContent);
    } catch (e) {
      // If creating the embedded modal somehow fails, as a last resort try
      // opening a new tab (wrap in try/catch so errors don't bubble).
      try {
        window.open(calendlyConfig.url, '_blank', 'noopener,noreferrer');
      } catch (ee) {
        // swallow
      }
    }
  }
};

/**
 * Create a simple in-page modal overlay that embeds Calendly via iframe.
 * This avoids opening a new browser tab and preserves user context on the site.
 */
const openEmbeddedCalendlyModal = (url: string, label?: string) => {
  try {
    // Avoid creating multiple overlays
    if (document.getElementById('calendly-embedded-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'calendly-embedded-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

  const container = document.createElement('div');
  container.id = 'calendly-embedded-container';
  // Keep inline sizing in sync with our stylesheet so the CSS isn't overridden
  // by the element's inline styles (which take precedence). Match the compact
  // layout used in the SCSS: max-width 800px and height 640px for desktop.
  container.style.width = '100%';
  container.style.maxWidth = '1000px';
  container.style.marginTop= '15px';
  container.style.marginBottom = '15px';
  container.style.marginLeft = '15px';
  container.style.marginRight = '15px';
  container.style.height = '100vh';
  container.style.maxHeight = '640px';
  container.style.background = '#fff';
    container.style.borderRadius = '8px';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'calendly-embedded-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close scheduling dialog');
    closeBtn.innerText = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '8px';
    closeBtn.style.zIndex = '10002';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';

    const iframe = document.createElement('iframe');

    // If the target is a Calendly URL, prefer adding embed query params so the
    // embedded view behaves like an inline/modal embed and uses the embed layout
    // (this is a safe, non-destructive addition—only add params when host is calendly.com).
    try {
      const parsed = new URL(url);
      if (parsed.hostname && parsed.hostname.includes('calendly.com')) {
        // Only set embed params if they're not already present
        if (!parsed.searchParams.has('embed_domain')) {
          parsed.searchParams.set('embed_domain', window.location.hostname);
        }
        if (!parsed.searchParams.has('embed_type')) {
          // Request an inline/embed type; Calendly will often render the event
          // details in a more compact layout for embedded contexts.
          parsed.searchParams.set('embed_type', 'Inline');
        }
        url = parsed.toString();
      }
    } catch (e) {
      // ignore URL parsing errors and fall back to provided url
    }

    iframe.src = url;
    iframe.title = label || 'Calendly scheduling';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    // Close handler
    const close = () => {
      try {
        if (window.Calendly && typeof window.Calendly.closePopupWidget === 'function') {
          // Ensure Calendly widget is closed if it was used
          window.Calendly.closePopupWidget();
        }
      } catch (e) {
        // ignore
      }
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKeyDown);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
    };

    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) close();
    });

    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKeyDown);

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  } catch (err) {
    // last-resort fallback: open in new tab
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // swallow
    }
  }
};

/**
 * Track Calendly events
 */
export const trackCalendlyEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'calendly',
      ...properties
    });
  }
};
