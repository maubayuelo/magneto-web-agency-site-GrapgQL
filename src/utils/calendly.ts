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
export const loadCalendlyScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Calendly is already loaded
    if (window.Calendly) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    if (document.querySelector('script[src*="calendly.com"]')) {
      // Script exists, wait for it to load
      const checkCalendly = () => {
        if (window.Calendly) {
          resolve();
        } else {
          setTimeout(checkCalendly, 100);
        }
      };
      checkCalendly();
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => {
      // Wait a bit for Calendly to initialize
      setTimeout(() => {
        if (window.Calendly) {
          resolve();
        } else {
          reject(new Error('Calendly failed to load'));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load Calendly script'));
    document.head.appendChild(script);
  });
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
}) => {
  try {
    // If caller prefers a new window (avoids iframe/permission policies), open immediately
    const targetUrl = new URL(options?.customUrl || calendlyConfig.url);
    targetUrl.searchParams.set('utm_source', calendlyConfig.defaultUtm.utmSource);
    targetUrl.searchParams.set('utm_medium', calendlyConfig.defaultUtm.utmMedium);
    targetUrl.searchParams.set('utm_campaign', calendlyConfig.defaultUtm.utmCampaign);
    if (options?.utmContent) targetUrl.searchParams.set('utm_content', options.utmContent);
    if (options?.utmTerm) targetUrl.searchParams.set('utm_term', options.utmTerm);

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
    // Final fallback: open Calendly in a new tab
    try {
      window.open(calendlyConfig.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // swallow
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
    container.style.width = '90%';
    container.style.maxWidth = '980px';
    container.style.height = '80%';
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
