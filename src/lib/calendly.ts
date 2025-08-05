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
}

// Calendly configuration - UPDATE THIS WITH YOUR ACTUAL CALENDLY URL
export const calendlyConfig: CalendlyConfig = {
  url: 'https://calendly.com/your-username/strategy-call', // Replace with your actual Calendly URL
  defaultUtm: {
    utmSource: 'website',
    utmMedium: 'cta',
    utmCampaign: 'strategy_call'
  }
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
}) => {
  try {
    await loadCalendlyScript();
    
    // Build URL with UTM parameters
    const url = new URL(options?.customUrl || calendlyConfig.url);
    
    // Add UTM parameters
    url.searchParams.set('utm_source', calendlyConfig.defaultUtm.utmSource);
    url.searchParams.set('utm_medium', calendlyConfig.defaultUtm.utmMedium);
    url.searchParams.set('utm_campaign', calendlyConfig.defaultUtm.utmCampaign);
    
    if (options?.utmContent) {
      url.searchParams.set('utm_content', options.utmContent);
    }
    
    if (options?.utmTerm) {
      url.searchParams.set('utm_term', options.utmTerm);
    }

    // Open Calendly popup
    window.Calendly.initPopupWidget({
      url: url.toString()
    });

    // Track event (if you have analytics)
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
      gtag('event', 'calendly_popup_opened', {
        event_category: 'engagement',
        event_label: options?.utmContent || 'strategy_call'
      });
    }
  } catch (error) {
    console.error('Error opening Calendly popup:', error);
    // Fallback: open in new tab
    window.open(calendlyConfig.url, '_blank');
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
