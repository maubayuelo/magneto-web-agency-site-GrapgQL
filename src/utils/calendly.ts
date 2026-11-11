// Calendly integration utilities
// src/lib/calendly.ts

// EN only (the defaults); never import the FR/ES dictionaries in client code (ADR 0005).
import { en } from '@/i18n/dictionaries/en';
import { lockPageScroll } from '@/utils/scroll-lock';

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
  url: 'https://calendly.com/magnetomarketing/free-strategy-call', // Replace with your actual Calendly URL
  defaultUtm: {
    utmSource: 'website',
    utmMedium: 'cta',
    utmCampaign: 'strategy_call'
  }
  ,
  // Default to our embedded modal. Consumers can override by passing `forceNewWindow: true`
  // to `openCalendlyPopup` or the CalendlyButton.
  preferNewWindow: false
};

/** Strings of the booking modal. Built with DOM APIs, so they are passed in rather than read from React. */
export interface CalendlyLabels {
  closeDialog: string;
  frameTitle: string;
}

/** Calendly custom-question prefill (5d-lite §5.2, B2): a1–a3 = the event's questions in order. */
export type CalendlyAnswerKey = 'a1' | 'a2' | 'a3';
export interface CalendlyPrefill {
  customAnswers?: Partial<Record<CalendlyAnswerKey, string>>;
}

type Gtag = (...args: unknown[]) => void;

/** Raw gtag on purpose: a no-op until 5f defines window.gtag. */
const sendOpenedEvent = (label: string | undefined, method: 'new_tab' | 'embedded_modal') => {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', 'calendly_popup_opened', {
    event_category: 'engagement',
    event_label: label || 'strategy_call',
    method,
  });
};

/**
 * Opens the Calendly booking flow: our own iframe modal, or a new tab when asked.
 * Design round A6-alt: Calendly's widget.js / widget.css are not loaded; the modal is the only in-page path.
 */
export const openCalendlyPopup = async (options?: {
  utmContent?: string;
  utmTerm?: string;
  /**
   * Ignored (5d-lite, D-8 revised): every locale and trigger opens the single event in `calendlyConfig.url`.
   * Kept so callers that still pass a CMS link (hero, final CTA, lead magnet) compile unchanged.
   */
  customUrl?: string;
  /** If true, open Calendly in a new browser tab/window instead of the embedded modal. */
  forceNewWindow?: boolean;
  /** Optional map of utm_* params to append to the Calendly URL */
  utmParams?: Record<string, string | undefined>;
  /** Localized strings for the booking modal (ADR 0005); EN dictionary values when omitted. */
  labels?: CalendlyLabels;
  /** Booking-dialog answers, sent as URL params so the modal and a new window both receive them. */
  prefill?: CalendlyPrefill;
}): Promise<void> => {
  // Built outside the try so the error fallback below also keeps utm + answers.
  const targetUrl = new URL(calendlyConfig.url);
  try {
    // D-8 revised (free Calendly plan): one event for all locales, configured with the a1–a3 questions.
    // CMS links (ctaLinkHero, finalCtaSection.ctaLink) may still point at another event, so customUrl is not used.
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

    // Only non-empty answers: an empty aN would overwrite nothing useful and lengthens the URL.
    const answers = options?.prefill?.customAnswers;
    if (answers) {
      (['a1', 'a2', 'a3'] as const).forEach((key) => {
        const value = answers[key]?.trim();
        if (value) targetUrl.searchParams.set(key, value);
      });
    }

    const useNewWindow = options?.forceNewWindow ?? calendlyConfig.preferNewWindow;

    if (useNewWindow) {
      window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer');
      sendOpenedEvent(options?.utmContent, 'new_tab');
      return;
    }

    if (openEmbeddedCalendlyModal(targetUrl.toString(), options?.utmContent, options?.labels)) {
      sendOpenedEvent(options?.utmContent, 'embedded_modal');
    }
  } catch (error) {
    // Avoid noisy errors in console; log only in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error opening Calendly popup:', error);
    }
    // Last resort: a new tab, so the visitor can still book.
    try {
      window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      // swallow
    }
  }
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The same ✕ as the booking dialog's `.ec-close` (EmailCollectorProvider). */
const createCloseIcon = (): SVGSVGElement => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'calendly-modal__close-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M5 5l14 14M19 5L5 19');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
  return svg;
};

/**
 * In-page modal that embeds Calendly in an iframe. Styles: src/styles/components/calendly.scss.
 * overlay (z-index 10000, above the 5f consent banner) → dialog container → toolbar with the close button → iframe.
 * Closes on the ✕ and on Escape only: a backdrop tap does not close it (design round 1a, Mauricio 2026-11-11), because
 * an accidental tap would lose progress in Calendly's multi-step flow.
 * Returns true when it opened a new modal.
 */
const openEmbeddedCalendlyModal = (url: string, label?: string, labels: CalendlyLabels = en.calendly): boolean => {
  let unlockScroll: (() => void) | null = null;
  try {
    // Avoid creating multiple overlays
    if (document.getElementById('calendly-embedded-overlay')) return false;

    // D-10: named dialog, focus moved to its close button, then returned. No Tab trap: the iframe is cross-origin.
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const overlay = document.createElement('div');
    overlay.id = 'calendly-embedded-overlay';
    overlay.className = 'calendly-modal';

    const container = document.createElement('div');
    container.id = 'calendly-embedded-container';
    container.className = 'calendly-modal__dialog';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', labels.frameTitle);

    const bar = document.createElement('div');
    bar.className = 'calendly-modal__bar';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'calendly-embedded-close';
    closeBtn.className = 'calendly-modal__close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', labels.closeDialog);
    closeBtn.appendChild(createCloseIcon());

    // embed_domain must stay: Calendly only posts its `calendly.*` message events to the page when it is set
    // (design round A6 evidence 3). Only added for calendly.com URLs and when not already present.
    try {
      const parsed = new URL(url);
      if (parsed.hostname && parsed.hostname.includes('calendly.com')) {
        if (!parsed.searchParams.has('embed_domain')) {
          parsed.searchParams.set('embed_domain', window.location.hostname);
        }
        if (!parsed.searchParams.has('embed_type')) {
          parsed.searchParams.set('embed_type', 'Inline');
        }
        url = parsed.toString();
      }
    } catch {
      // ignore URL parsing errors and fall back to provided url
    }

    const iframe = document.createElement('iframe');
    iframe.className = 'calendly-modal__frame';
    iframe.src = url;
    // utmContent wins over the dictionary title, as before (Phase 4 spec I-7).
    iframe.title = label || labels.frameTitle;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
    };

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
      // Unlock first: restoring the scroll position before focusing keeps the page from jumping to the trigger.
      unlockScroll?.();
      unlockScroll = null;
      if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
    };

    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKeyDown);

    bar.appendChild(closeBtn);
    container.appendChild(bar);
    container.appendChild(iframe);
    overlay.appendChild(container);
    unlockScroll = lockPageScroll();
    document.body.appendChild(overlay);
    closeBtn.focus();
    return true;
  } catch {
    unlockScroll?.();
    document.getElementById('calendly-embedded-overlay')?.remove();
    // last-resort fallback: open in new tab
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // swallow
    }
    return false;
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
