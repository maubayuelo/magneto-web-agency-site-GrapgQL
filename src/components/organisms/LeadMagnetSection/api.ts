import { fetchWPGraphQL } from '@/utils/wp-graphql';
import type { LeadMagnetSectionData, LinkNode } from './types';

export const LEAD_MAGNET_SECTION_QUERY = `
  query LeadMagnetSection {
    page(id: "home", idType: URI) {
      leadMagnetSection {
        overTitleLeadMagnetSection
        titleLeadMagnetSection
        subtitleLeadMagnetSection
        ctaTextLeadMagnetSection
        ctaLinkLeadMagnetSection {
          node {
            id
            uri
            ... on MediaItem {
              sourceUrl
              mimeType
              databaseId
              guid
              mediaDetails {
                file
                sizes {
                  file
                  sourceUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getLeadMagnetSection(): Promise<LeadMagnetSectionData> {
  const data = await fetchWPGraphQL(LEAD_MAGNET_SECTION_QUERY);
  const raw = (data?.page?.leadMagnetSection as LeadMagnetSectionData) || {};
  // Provide a normalized alias ctaLink to keep consuming code compatible
  const linkNode = raw.ctaLinkLeadMagnetSection as LinkNode | undefined | null;
  const normalized: LeadMagnetSectionData = {
    ...raw,
    ctaLink: linkNode?.node?.url || linkNode?.node?.uri || undefined,
    // Start without trusting any provided sourceUrl; prefer REST lookup by databaseId below
    downloadUrl: undefined,
  };

  // Prefer guid when MediaItem reports mimeType=application/pdf — guid usually points to the original file URL
  try {
    const nodeAny = (linkNode?.node as any) || {};
    const mime = (nodeAny?.mimeType || '').toLowerCase();
    const guid = nodeAny?.guid;
    if (mime.includes('pdf') && guid && typeof guid === 'string') {
      normalized.downloadUrl = guid;
    }
  } catch (err) {
    // ignore
  }
  // Simplified logic: prefer guid when present; otherwise prefer a direct .pdf URL if provided;
  // otherwise use the WP REST API (by databaseId) to obtain `source_url`; finally fall back to any provided URL.
  try {
    const nodeAny = (linkNode?.node as any) || {};
    if (!normalized.downloadUrl) {
      const possibleUrl = nodeAny.sourceUrl || nodeAny.url || nodeAny.link || undefined;
      const mime = (nodeAny?.mimeType || '').toLowerCase();

      // If the node explicitly claims to be a PDF and there's a direct PDF URL, use it
      if (mime.includes('pdf') && possibleUrl && typeof possibleUrl === 'string' && possibleUrl.toLowerCase().includes('.pdf')) {
        normalized.downloadUrl = possibleUrl;
      }

      // REST fallback by databaseId
      // Prefer REST lookup before accepting non-cms sourceUrl values; REST will return canonical source_url
      if (nodeAny?.databaseId) {
        // Derive a sane REST base even if NEXT_PUBLIC_WORDPRESS_URL points to the GraphQL
        // endpoint (e.g. https://cms.example.com/graphql). Strip known endpoint suffixes
        // so we build: https://cms.example.com/wp-json/wp/v2/media/:id
        try {
          const rawRestBase = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.magnetomarketing.co';
          const restBase = rawRestBase.replace(/\/(?:graphql|wp-json)\/?$/i, '').replace(/\/$/, '');
          const restUrl = `${restBase}/wp-json/wp/v2/media/${nodeAny.databaseId}`;
          const r = await fetch(restUrl).catch(() => null);
          if (r && r.ok) {
            const j = await r.json().catch(() => null);
            const src = j?.source_url || (j?.media_details && j.media_details.file ? `${restBase}/wp-content/uploads/${j.media_details.file}` : null);
            if (src && typeof src === 'string') normalized.downloadUrl = src;
          }
        } catch (err) {
          // ignore
        }
      }

      // final fallback: any direct URL provided (even if not .pdf)
      if (!normalized.downloadUrl && possibleUrl) normalized.downloadUrl = possibleUrl;
    }
  } catch (err) {
    // ignore
  }

  return normalized;
}
