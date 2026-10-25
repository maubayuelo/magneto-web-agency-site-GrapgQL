// Media from the EN original (ADR 0004, D3). Pure.
// WPML points FR/ES image fields at attachment copies whose size lists can be stale (fewer srcset entries).
// The copy is only trusted for its altText (translatable); the file and sizes come from the EN original.

/**
 * Helper fields to add to an image `node { … }` selection, next to its own subfields:
 *   node { <subfields> ${mediaOriginalFields('<subfields>')} }
 * EN requests (mediaOriginal: false) only add `databaseId languageCode`, which the resolver strips.
 */
export function mediaOriginalFields(subfields: string): string {
  return `databaseId languageCode translations @include(if: $mediaOriginal) { languageCode ${subfields} }`;
}

/** Full subfield set for images whose mappers read sizes and dimensions. */
export const MEDIA_NODE_FIELDS = `sourceUrl altText mediaDetails { width height sizes { name width height sourceUrl } }`;

export interface WpMediaTranslation {
  languageCode?: string | null;
  sourceUrl?: string | null;
  mediaDetails?: unknown;
}

export interface WpMediaNode {
  databaseId?: number | null;
  languageCode?: string | null;
  translations?: WpMediaTranslation[] | null;
  sourceUrl?: string | null;
  altText?: string | null;
  mediaDetails?: unknown;
}

type Resolved<T> = Omit<T, 'databaseId' | 'languageCode' | 'translations'>;

const ORIGINAL_LANGUAGE = 'en';

/**
 * Returns the node with the EN original's sourceUrl/mediaDetails when the node is a non-EN copy and the EN
 * translation was fetched; keeps the copy's altText. Always strips the helper fields so mappers see the
 * shape they saw before.
 */
export function resolveOriginalMedia<T extends WpMediaNode>(node: T | null | undefined): Resolved<T> | null {
  if (!node) return null;
  const resolved: WpMediaNode = { ...node };
  delete resolved.databaseId;
  delete resolved.languageCode;
  delete resolved.translations;
  if (node.languageCode && node.languageCode !== ORIGINAL_LANGUAGE) {
    const original = (node.translations ?? []).find((t) => t?.languageCode === ORIGINAL_LANGUAGE);
    if (original) {
      if ('sourceUrl' in original) resolved.sourceUrl = original.sourceUrl;
      if ('mediaDetails' in original) resolved.mediaDetails = original.mediaDetails;
    }
  }
  return resolved as Resolved<T>;
}

/** Same as resolveOriginalMedia for the usual `{ node }` wrapper; keeps `null`/missing wrappers as they were. */
export function resolveMediaWrapper<T extends WpMediaNode>(
  wrapper: { node?: T | null } | null | undefined,
): { node: Resolved<T> | null } | null | undefined {
  if (!wrapper) return wrapper as null | undefined;
  return { ...wrapper, node: resolveOriginalMedia(wrapper.node) };
}
