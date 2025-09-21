// Simple GraphQL helper for communicating with a WordPress GraphQL endpoint.
// Beginners: put a .env variable for the CMS URL instead of hardcoding for production.
const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://magneto-cms.local/graphql';

/**
 * fetchWPGraphQL
 * @param query GraphQL query string
 * @param variables Optional variables object
 * @returns data object from the GraphQL response or throws on errors
 *
 * Notes for beginners:
 * - This helper centralizes how we call the CMS. It sets JSON headers and
 *   returns `json.data` so callers can use `data.someField` directly.
 * - For Next.js, we pass `{ next: { revalidate: 60 } }` to the fetch options to
 *   enable simple incremental static regeneration (ISG) behavior. Adjust as needed.
 */
export async function fetchWPGraphQL(query: string, variables: Record<string, any> = {}) {
  const res = await fetch(WP_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    // `next.revalidate` tells Next.js how long to cache the response before revalidating.
    // Remove or change this if you don't want ISR behavior.
    next: { revalidate: 60 },
  });

  const json = await res.json();

  // If the GraphQL layer returned errors, throw them so callers can handle/log them.
  if (json.errors) throw new Error(JSON.stringify(json.errors));

  return json.data;
}