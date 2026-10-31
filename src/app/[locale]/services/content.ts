import DOMPurify from 'isomorphic-dompurify';
import type { ContentBody, InternalLink } from './types';

export const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

export function richBody(value: unknown): ContentBody | null {
  const html = DOMPurify.sanitize(text(value), { USE_PROFILES: { html: true }, FORBID_ATTR: ['id', 'name'] });
  const visible = html.replace(/<[^>]*>/g, '').replace(/&(?:nbsp|#160|#x0*a0);/gi, ' ').replace(/[\s\u200b-\u200d\ufeff]/g, '');
  return visible ? { kind: 'html', html } : null;
}

export function contentBody(html: unknown, legacy: unknown): ContentBody | null {
  return richBody(html) ?? (text(legacy) ? { kind: 'text', text: text(legacy) } : null);
}

export function internalLink(label: unknown, path: unknown, allowed: readonly string[]): InternalLink | null {
  if (typeof path !== 'string' || /[\u0000-\u001f\u007f\\]/.test(path)) return null;
  return text(label) && allowed.includes(path.trim()) ? { text: text(label), path: path.trim() } : null;
}

/** Invalid or duplicate IDs are omitted, not guessed from translated titles. */
export function uniqueAnchor(value: unknown, used: Set<string>): string | null {
  const id = text(value);
  if (!['build', 'fix', 'care'].includes(id) || used.has(id)) return null;
  used.add(id);
  return id;
}
