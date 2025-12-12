import { NextResponse } from 'next/server';
// Ensure this API route runs on the Node.js runtime (not Edge),
// because we rely on Node APIs and stable TLS behavior for upstream fetches.
export const runtime = 'nodejs';
// Avoid App Router caching on this proxy endpoint.
export const dynamic = 'force-dynamic';

// Simple server-side proxy for forwarding GraphQL requests to the WP GraphQL endpoint.
// This avoids exposing the CMS host to client-side fetches and prevents CORS issues.
const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.magnetomarketing.co/graphql';

export async function POST(request: Request) {
  try {
    const body = await request.text();

    // Configure fetch options for upstream GraphQL request
    let fetchOpts: any = {
      method: 'POST',
      // Send explicit headers to avoid upstream WAF heuristic blocks
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/graphql-response+json;q=0.9, */*;q=0.1',
        // Friendly UA string (some WAFs block unknown default UAs)
        'User-Agent': 'MagnetoProxy/1.0 (+https://www.magnetomarketing.co)'
      },
      // Do not forward any cookies; this route is a pure server-side proxy
      body,
      // Disable any implicit caching on the fetch call
      cache: 'no-store',
    };

    // Make the upstream request using standard fetch
    const res = await fetch(WP_GRAPHQL_URL, fetchOpts);

    const text = await res.text();

    // If the upstream returned a non-OK status or something that doesn't
    // look like JSON, wrap it in a structured JSON response to make
    // client-side debugging easier (the client helper logs this).
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('+json');

    if (!res.ok || !isJson) {
      const payload = {
        error: 'Upstream WP GraphQL returned non-OK or non-JSON response',
        status: res.status,
        contentType,
        body: text,
        upstream: WP_GRAPHQL_URL,
      };

      return new NextResponse(JSON.stringify(payload), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
