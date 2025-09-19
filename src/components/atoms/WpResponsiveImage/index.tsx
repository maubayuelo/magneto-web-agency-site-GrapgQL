// Use native <img> so we can control srcset/sizes generated from WP media sizes.
type WpImageSize = {
  name: string;
  sourceUrl: string;
  width: number;
  height?: number;
};

type Props = {
  image: {
    altText?: string;
    sourceUrl: string;
    mediaDetails?: {
      sizes?: WpImageSize[];
    };
  };
  /** Target display width (used as a hint for selecting primary src) */
  width?: number;
  /** Target display height (used as a hint) */
  height?: number;
  className?: string;
  /** Optional sizes attribute override (e.g. responsive layout rules) */
  sizesAttr?: string;
  /** When true, omit width/height/srcSet/sizes/style so CSS can control layout */
  omitSizeAttributes?: boolean;
};

function normalizeUrl(url?: string) {
  if (!url) return url;
  // WordPress sometimes returns protocol-less URLs (e.g. //example.com/...)
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export default function WpResponsiveImage({
  image,
  width = 1024,
  height = 600,
  className,
  sizesAttr,
  omitSizeAttributes = false,
}: Props) {
  const sizes = image?.mediaDetails?.sizes || [];

  // Build a list of size entries including the original 'full' source.
  const entries: Array<{ src: string; w: number }> = [];

  sizes.forEach((s) => {
    const src = normalizeUrl(s?.sourceUrl);
    if (src && s?.width) entries.push({ src, w: s.width });
  });

  // Add the original source as the largest fallback. We don't always have width for it,
  // so assume a large value if missing. Ensure we have a string for src.
  const originalSrc = normalizeUrl(image.sourceUrl) || image.sourceUrl;
  const originalWidth = entries.length ? Math.max(...entries.map((e) => e.w)) : 1920;
  if (originalSrc) entries.push({ src: originalSrc, w: originalWidth });

  // Remove duplicates (same src) and sort by width ascending
  const bySrc = new Map<string, number>();
  entries.forEach((e) => bySrc.set(e.src, Math.max(bySrc.get(e.src) || 0, e.w)));
  const unique = Array.from(bySrc.entries()).map(([src, w]) => ({ src, w })).sort((a, b) => a.w - b.w);

  // Build a srcset string like: "https://.../small.jpg 300w, https://.../large.jpg 1024w"
  const srcSet = unique.map((e) => `${e.src} ${e.w}w`).join(', ');

  // sizes attribute: allow override via prop, otherwise use a sensible default.
  const sizesAttribute =
    sizesAttr || '(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px';

  // Pick a primary src to use for the src attribute. Choose the smallest image that
  // is >= the target width; otherwise fall back to the largest available.
  const primary = unique.find((u) => u.w >= width) || unique[unique.length - 1];

  // If the caller requests omission of size-related attributes, render a
  // plain <img> that lets external CSS control sizing and layout.
  if (omitSizeAttributes) {
    return (
      <img
        className={className}
        src={primary?.src || originalSrc}
        alt={image.altText || ''}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <img
      className={className}
      src={primary?.src || originalSrc}
      alt={image.altText || ''}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizesAttribute}
      loading="lazy"
      decoding="async"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}