// WordPress endpoint resolution. The only place that reads the WordPress URL env vars for
// fetchWPGraphQL, the /api/wp-graphql proxy and the LeadMagnet REST lookup.
//
// NEXT_PUBLIC_* must be read as literal `process.env.NAME` so Next can inline them into
// client bundles. Do not use process.env[name] here.
//
// There is deliberately no production fallback: a missing variable throws instead of silently
// pointing local or preview builds at the live CMS.

const WP_ENV_HELP =
  'Set it in .env.local (local) or in Vercel → Settings → Environment Variables (Production and Preview).';

/** WPGraphQL endpoint, e.g. http://magneto-cms-2.local/graphql. Throws if not configured. */
export function getWpGraphqlUrl(): string {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    throw new Error(
      `Missing NEXT_PUBLIC_WORDPRESS_API_URL — the WPGraphQL endpoint, e.g. http://magneto-cms-2.local/graphql. ${WP_ENV_HELP}`
    );
  }
  return url;
}

/**
 * WordPress site base (no trailing slash, no /graphql or /wp-json suffix), e.g.
 * http://magneto-cms-2.local — used to build REST URLs. Throws if not configured.
 */
export function getWpBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  if (!raw) {
    throw new Error(
      `Missing NEXT_PUBLIC_WORDPRESS_URL — the WordPress site base, e.g. http://magneto-cms-2.local. ${WP_ENV_HELP}`
    );
  }
  return raw.replace(/\/(?:graphql|wp-json)\/?$/i, '').replace(/\/$/, '');
}
