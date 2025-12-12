// Generic third-party script loader with idempotent behavior
// Provides simple warm (preconnect/preload) and load (inject script) helpers.

export type LoadOptions = {
  src: string;
  as?: 'script' | 'style' | 'image' | 'font';
  crossOrigin?: string | '';
  attrs?: Record<string, string>;
};

const _promises: Record<string, Promise<void> | undefined> = {};

export const warmResource = (href: string, as: LoadOptions['as'] = 'script') => {
  if (typeof document === 'undefined') return;
  try {
    // preconnect
    const pre = document.createElement('link');
    pre.rel = 'preconnect';
    pre.href = href.replace(/(^https?:\/\/[^/]+).*/i, '$1');
    pre.crossOrigin = '';
    document.head.appendChild(pre);

    // dns-prefetch fallback
    const dns = document.createElement('link');
    dns.rel = 'dns-prefetch';
    dns.href = href.replace(/(^https?:\/\/[^/]+).*/i, '$1');
    document.head.appendChild(dns);

    // Avoid preload hints to prevent console warnings when assets are not used immediately
  } catch (e) {
    // swallow
  }
};

export const loadScript = (opts: LoadOptions): Promise<void> => {
  if (typeof document === 'undefined') return Promise.resolve();
  if (Object.prototype.hasOwnProperty.call(_promises, opts.src) && _promises[opts.src]) {
    return _promises[opts.src]!;
  }

  _promises[opts.src] = new Promise<void>((resolve, reject) => {
    try {
      // Avoid duplicate script tags
      if (document.querySelector(`script[src="${opts.src}"]`)) {
        // wait for global to appear or resolve after short delay
        const t = setInterval(() => {
          // best-effort: resolve after 200ms if no explicit global check
          clearInterval(t);
          resolve();
        }, 200);
        return;
      }

      const s = document.createElement('script');
      s.src = opts.src;
      s.async = true;
      s.defer = true;
      if (opts.crossOrigin !== undefined) s.crossOrigin = opts.crossOrigin as string;
      if (opts.attrs) {
        Object.keys(opts.attrs).forEach((k) => s.setAttribute(k, opts.attrs![k]));
      }
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${opts.src}`));
      document.head.appendChild(s);
    } catch (err) {
      reject(err as Error);
    }
  });

  return _promises[opts.src]!;
};

export default {
  warmResource,
  loadScript,
};
