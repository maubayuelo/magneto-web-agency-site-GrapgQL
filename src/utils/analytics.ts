// Phase 5f §3 (ADR 0007): Google Analytics 4, loaded only after an explicit, still-valid grant.
// Nothing here runs at import time and nothing warms a connection: a preconnect is already a request to Google.
// The ConsentProvider owns consent transitions; this module tracks the current authorization with a generation
// number, so a script load that settles after a withdrawal can never initialize measurement.
import thirdParty from './thirdParty';
import { clearGaCookies, getEffectiveConsent } from './consent';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    // Google's documented per-property opt-out flag, `window['ga-disable-G-XXXX']`.
    [gaDisable: `ga-disable-${string}`]: boolean | undefined;
  }
}

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;
let warnedInvalidId = false;

/**
 * The GA4 Measurement ID, read at call time. Must stay the literal `process.env.NEXT_PUBLIC_GA_ID` so Next inlines it
 * at build. Anything that is not `G-…` (a placeholder, a GTM ID, whitespace) counts as not configured.
 */
export function getGaId(): string {
  const id = (process.env.NEXT_PUBLIC_GA_ID ?? '').trim();
  if (id === '') return '';
  if (!GA_ID_PATTERN.test(id)) {
    if (process.env.NODE_ENV === 'development' && !warnedInvalidId) {
      warnedInvalidId = true;
      console.warn('[analytics] NEXT_PUBLIC_GA_ID is not a GA4 Measurement ID (G-…); analytics stays off.');
    }
    return '';
  }
  return id;
}

/** Build-time switch: without a valid ID there is no banner, no footer control and no storage or cookie access. */
export const isAnalyticsConfigured = (): boolean => getGaId() !== '';

export const GA_SCRIPT = (id: string = getGaId()) => `https://www.googletagmanager.com/gtag/js?id=${id}`;

let generation = 0;
let grantActive = false;
let pending: Promise<void> | null = null;
let scriptLoaded = false;

const isCurrent = (gen: number) =>
  gen === generation && grantActive && getEffectiveConsent()?.analytics === 'granted';

function initialize(gen: number, id: string) {
  // Active queue wrapper. A retained reference stays inert after withdrawal (generation check). gtag.js needs the
  // `arguments` object itself, not an array.
  const wrapper: Gtag = function gtag() {
    if (gen !== generation || !grantActive) return;
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.gtag = wrapper;
  window[`ga-disable-${id}`] = false;
  wrapper('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  wrapper('js', new Date());
  // Preview builds also run with NODE_ENV=production, so only Vercel's target can tell Production apart.
  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
  wrapper('config', id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(!isProd ? { debug_mode: true } : {}),
  });
}

function settleStale(stub: Gtag, id: string) {
  // Never touch a newer grant's state: only remove our own stub, and keep the opt-out on unless a newer grant runs.
  if (window.gtag === stub) delete window.gtag;
  if (!grantActive) window[`ga-disable-${id}`] = true;
}

/**
 * No-op unless configured and the current choice is a valid grant. Repeated calls for the same grant share one
 * promise and initialize once. Load failures (ad blockers) are swallowed: no UI error, analytics stays off.
 */
export function loadAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const id = getGaId();
  if (!id) return Promise.resolve();
  if (getEffectiveConsent()?.analytics !== 'granted') return Promise.resolve();
  if (grantActive && pending) return pending;

  generation += 1;
  grantActive = true;
  const gen = generation;

  // Consent permits the script request, not collection yet: opt-out stays on until initialization.
  window[`ga-disable-${id}`] = true;
  window.dataLayer = window.dataLayer || [];
  // Queue stub: drops events until initialization succeeds (no config, js or application events while loading).
  const stub: Gtag = () => {};
  window.gtag = stub;

  pending = thirdParty.loadScript({ src: GA_SCRIPT(id) }).then(
    () => {
      scriptLoaded = true;
      if (!isCurrent(gen)) {
        settleStale(stub, id);
        return;
      }
      initialize(gen, id);
    },
    () => {
      if (!isCurrent(gen)) {
        settleStale(stub, id);
        return;
      }
      window[`ga-disable-${id}`] = true;
      if (window.gtag === stub) delete window.gtag;
    },
  );
  return pending;
}

/**
 * Synchronous withdrawal: invalidate the grant first, set the opt-out flag, remove gtag, drop commands gtag.js has not
 * processed yet, delete reachable GA cookies. No reload. Requests already sent cannot be recalled.
 */
export function disableAnalytics(): void {
  grantActive = false;
  generation += 1;
  pending = null;
  if (typeof window === 'undefined') return;
  const id = getGaId();
  if (!id) return;
  window[`ga-disable-${id}`] = true;
  delete window.gtag;
  // Before gtag.js runs, anything in dataLayer is unprocessed and must not replay on a later grant. Once it runs, it
  // processes each push synchronously, so nothing is left to discard.
  if (!scriptLoaded && Array.isArray(window.dataLayer)) window.dataLayer.length = 0;
  clearGaCookies(id);
}

/** Contract unchanged: a no-op without `window.gtag`. */
export const gtagEvent = (action: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params || {});
  }
};

const analytics = {
  loadAnalytics,
  disableAnalytics,
  gtagEvent,
};

export default analytics;
