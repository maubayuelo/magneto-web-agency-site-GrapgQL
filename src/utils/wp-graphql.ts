// Simple GraphQL helper for communicating with a WordPress GraphQL endpoint.
// Beginners: put a .env variable for the CMS URL instead of hardcoding for production.
// The CMS URL comes from getWpGraphqlUrl() (src/utils/wordpress.ts), which throws if the
// env var is missing — there is no production fallback.

// When running in the browser, route requests through our server-side proxy to
// avoid CORS and to keep the CMS host hidden from client code. Server-side
// (Node) will continue to call the external getWpGraphqlUrl() directly.
const IS_BROWSER = typeof window !== 'undefined';
const CLIENT_PROXY_PATH = '/api/wp-graphql';

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
import { devConsoleError, devConsoleWarn } from './dev-console';
import { getWpGraphqlUrl } from './wordpress';

export async function fetchWPGraphQL(query: string, variables: Record<string, any> = {}) {
  // Resolved before the try so a missing env var surfaces as itself, not as "fetch failed".
  // In the browser only the proxy path is used, so the env var is never read there.
  const url = IS_BROWSER ? CLIENT_PROXY_PATH : getWpGraphqlUrl();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      // `next.revalidate` tells Next.js how long to cache the response before revalidating.
      // Remove or change this if you don't want ISR behavior.
      next: { revalidate: 60 },
    });
  } catch (e) {
    devConsoleError('WP GraphQL fetch failed to reach host', { url, error: e });
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

    devConsoleWarn('WP GraphQL invalid JSON response', { status: res.status, url, error: e, body: textBody });
    throw new Error(`WP GraphQL returned invalid JSON (status: ${res.status})`);
  }

  // If the GraphQL layer returned errors, throw them so callers can handle/log them.
  if (json.errors) {
    // Build a readable message (used both for logging and the thrown Error)
    const message = `WP GraphQL errors: ${Array.isArray(json.errors) ? json.errors.map((e: any) => e.message || JSON.stringify(e)).join(' | ') : JSON.stringify(json.errors)}`;
    // Compose a compact payload string so client dev overlays (which may collapse
    // object arguments) show readable information. Also keep a structured object
    // in the log if the environment supports it.
    const payload = { status: res.status, url, errors: json.errors };
    try {
      devConsoleWarn(`${message} | payload: ${JSON.stringify(payload)}`);
    } catch (_e) {
      // Fallback to structured log
      devConsoleWarn(message, payload, json);
    }
    // Attach the errors to the thrown Error so callers can inspect them programmatically
    const err = new Error(message);
    // @ts-ignore - attach original payload for callers that may inspect it
    err.graphQLErrors = json.errors;
    throw err;
  }

  if (!json.data) {
    // Log extended diagnostics to help figure out why `data` is missing.
    // Include response status, headers (if available), and the full parsed JSON.
    const diag: any = { json, status: res?.status };
    try {
      // Some runtimes expose headers as an iterable; normalize to a plain object
      const headersObj: Record<string, string> = {};
      if (res?.headers && typeof res.headers.forEach === 'function') {
        res.headers.forEach((value: string, key: string) => (headersObj[key] = value));
        diag.headers = headersObj;
      } else if (res?.headers && typeof Object.fromEntries === 'function') {
        try {
          // In some environments headers can be iterated
          diag.headers = Object.fromEntries(res.headers as any);
        } catch (_) {
          // ignore
        }
      }
    } catch (_e) {
      // ignore header extraction errors
    }

  devConsoleWarn('WP GraphQL response missing data', diag);
    // Attach the diagnostics to the thrown Error for programmatic inspection
    const err = new Error('WP GraphQL response missing data');
    // @ts-ignore
    err.diagnostics = diag;
    throw err;
  }

  return json.data;
}