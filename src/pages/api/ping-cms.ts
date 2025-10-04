import type { NextApiRequest, NextApiResponse } from 'next';

async function fetchJson(url: string, opts: RequestInit = {}) {
  try {
    const res = await fetch(url, opts as any);
    const contentType = res.headers.get('content-type') || '';
    let body: any;
    try {
      if (contentType.includes('application/json')) body = await res.json();
      else body = await res.text();
    } catch (e) {
      body = `Failed to parse body: ${String(e)}`;
    }
    return { ok: res.ok, status: res.status, statusText: res.statusText, body };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Read the endpoints from the same env vars your app uses
  const graphqlUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || '';
  const wpApiBase = process.env.WP_API || process.env.NEXT_PUBLIC_WORDPRESS_URL || '';

  const results: Record<string, any> = { graphqlUrl, wpApiBase };

  if (graphqlUrl) {
    // Send a minimal GraphQL query to check connectivity and errors
    const query = '{ __typename }';
    results.graphql = await fetchJson(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } else {
    results.graphql = { error: 'GRAPHQL_URL_NOT_SET' };
  }

  if (wpApiBase) {
    const pageUrl = `${wpApiBase.replace(/\/$/, '')}/pages/services`;
    results.wpPages = await fetchJson(pageUrl, { method: 'GET' });
  } else {
    results.wpPages = { error: 'WP_API_NOT_SET' };
  }

  // Log to server logs (visible in Vercel) for easier debugging
  // eslint-disable-next-line no-console
  console.error('ping-cms results:', JSON.stringify(results));

  res.status(200).json(results);
}
