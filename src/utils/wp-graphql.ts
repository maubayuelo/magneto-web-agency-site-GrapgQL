// Simple GraphQL helper for communicating with a WordPress GraphQL endpoint.
// Beginners: put a .env variable for the CMS URL instead of hardcoding for production.
// Accept either NEXT_PUBLIC_WORDPRESS_API_URL (commonly used in this repo) or
// NEXT_PUBLIC_WORDPRESS_URL for historical reasons. This makes the helper
// resilient to small env var naming differences between local and Vercel.
const WP_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://www.magnetomarketing.co/cms/graphql';

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
import { devConsoleError } from './dev-console';

export async function fetchWPGraphQL(query: string, variables: Record<string, any> = {}) {
  let res;
  try {
    res = await fetch(WP_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      // `next.revalidate` tells Next.js how long to cache the response before revalidating.
      // Remove or change this if you don't want ISR behavior.
      next: { revalidate: 60 },
    });
  } catch (e) {
    devConsoleError('WP GraphQL fetch failed to reach host', { url: WP_GRAPHQL_URL, error: e });
    throw new Error(`WP GraphQL fetch failed: ${String(e)}`);
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    // Attempt to get the raw text body for debug purposes
    let textBody: string | undefined;
    try {
      textBody = await res.text();
    } catch (_err) {
      textBody = undefined;
    }

    devConsoleError('WP GraphQL invalid JSON response', { status: res.status, url: WP_GRAPHQL_URL, error: e, body: textBody });
    throw new Error(`WP GraphQL returned invalid JSON (status: ${res.status})`);
  }

  // If the GraphQL layer returned errors, throw them so callers can handle/log them.
  if (json.errors) {
    // Build a readable message (used both for logging and the thrown Error)
    const message = `WP GraphQL errors: ${Array.isArray(json.errors) ? json.errors.map((e: any) => e.message || JSON.stringify(e)).join(' | ') : JSON.stringify(json.errors)}`;
    // Compose a compact payload string so client dev overlays (which may collapse
    // object arguments) show readable information. Also keep a structured object
    // in the log if the environment supports it.
    const payload = { status: res.status, url: WP_GRAPHQL_URL, errors: json.errors };
    try {
      devConsoleError(`${message} | payload: ${JSON.stringify(payload)}`);
    } catch (_e) {
      // Fallback to structured log
      devConsoleError(message, payload, json);
    }
    // Attach the errors to the thrown Error so callers can inspect them programmatically
    const err = new Error(message);
    // @ts-ignore - attach original payload for callers that may inspect it
    err.graphQLErrors = json.errors;
    throw err;
  }

  if (!json.data) {
    devConsoleError('WP GraphQL response missing data', { json });
    throw new Error('WP GraphQL response missing data');
  }

  return json.data;
}