// Lightweight Google Analytics (gtag) loader using the generic third-party loader
import thirdParty from './thirdParty';

const GA_ID = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GA_ID : undefined;

export const GA_SCRIPT = (id?: string) => `https://www.googletagmanager.com/gtag/js?id=${id || GA_ID}`;

export const warmAnalytics = () => {
  try {
    if (!GA_ID) return;
    thirdParty.warmResource(GA_SCRIPT());
  } catch (e) {
    // swallow
  }
};

export const loadAnalytics = async () => {
  if (!GA_ID) return;
  await thirdParty.loadScript({ src: GA_SCRIPT(), crossOrigin: 'anonymous' });
  // configure gtag if not configured
  if (typeof window !== 'undefined' && !(window as any).gtag) {
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(){(window as any).dataLayer.push(arguments);} // eslint-disable-line no-inner-declarations
    (window as any).gtag = gtag;
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', GA_ID);
  }
};

export const gtagEvent = (action: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, params || {});
  }
};

export default {
  warmAnalytics,
  loadAnalytics,
  gtagEvent,
};
