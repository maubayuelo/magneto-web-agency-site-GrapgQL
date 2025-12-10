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

    // Support a development-only fallback to ignore TLS verification when
    // NODE_TLS_REJECT_UNAUTHORIZED=0 is set in the environment (commonly in
    // `.env.local`). This is useful for local/dev when the CMS uses a
    // self-signed or otherwise invalid certificate. Do NOT enable in prod.
    let fetchOpts: any = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    };

    let res: any;

    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      // Use Node's https.request with rejectUnauthorized:false to bypass TLS
      // checks in local development when requested. This is a clear, explicit
      // dev-only fallback that works across Node runtimes.
      const https = await import('https');
      const url = new URL(WP_GRAPHQL_URL);

      const reqOptions: any = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        rejectUnauthorized: false,
      };

      res = await new Promise((resolve, reject) => {
        const req = https.request(reqOptions, (upstreamRes) => {
          let chunks: Uint8Array[] = [];
          upstreamRes.on('data', (c) => chunks.push(c));
          upstreamRes.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            // Build a small object that mimics fetch Response used later
            resolve({
              ok: upstreamRes.statusCode && upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 300,
              status: upstreamRes.statusCode,
              headers: new Map(Object.entries(upstreamRes.headers || {})),
              text: async () => body,
              json: async () => {
                try {
                  return JSON.parse(body);
                } catch (e) {
                  throw e;
                }
              },
            });
          });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
      });
    } else {
      res = await fetch(WP_GRAPHQL_URL, fetchOpts);
    }

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
