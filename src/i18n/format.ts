// Interpolation for dictionary values (ADR 0005). Pure and dictionary-free, so client components can import it
// without pulling any locale into their bundle. `dictionary.ts` re-exports both functions for server code.
import { cloneElement, isValidElement, type ReactNode } from 'react';

const PLACEHOLDER = /\{(\w+)\}/g;

/** For attributes and metadata: "Gallery image {n}", { n: 2 } → "Gallery image 2". Unknown names stay as is. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(PLACEHOLDER, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/**
 * For JSX children that mix text and values. Returns the parts in order, so React renders the same text
 * nodes (and SSR `<!-- -->` separators) as hand-written JSX:
 * "Magneto Web Consulting © {year}", { year: 2026 } → ["Magneto Web Consulting © ", 2026].
 * Empty text parts are dropped; element values get a key so an array child doesn't warn.
 */
export function formatParts(template: string, vars: Record<string, ReactNode>): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of template.matchAll(PLACEHOLDER)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(template.slice(last, index));
    const name = match[1];
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      const value = vars[name];
      parts.push(isValidElement(value) ? cloneElement(value, { key: `${name}-${parts.length}` }) : value);
    } else {
      parts.push(match[0]);
    }
    last = index + match[0].length;
  }
  if (last < template.length) parts.push(template.slice(last));
  return parts;
}
