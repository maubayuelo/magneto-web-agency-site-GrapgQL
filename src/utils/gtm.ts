import thirdParty from './thirdParty';

const GTM_ID = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GTM_ID : undefined;

export const GTM_SCRIPT = (id?: string) => `https://www.googletagmanager.com/gtm.js?id=${id || GTM_ID}`;

export const warmGtm = () => {
  try {
    if (!GTM_ID) return;
    thirdParty.warmResource(GTM_SCRIPT());
  } catch (e) {
    // swallow
  }
};

export const loadGtm = async () => {
  if (!GTM_ID) return;
  // inject the GTM script
  await thirdParty.loadScript({ src: GTM_SCRIPT(), crossOrigin: 'anonymous' });
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  }
};

export const gtmPush = (payload: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(payload);
  }
};

export default {
  warmGtm,
  loadGtm,
  gtmPush,
};
