import { NextResponse } from 'next/server';

// Simple server-side proxy for forwarding GraphQL requests to the WP GraphQL endpoint.
// This avoids exposing the CMS host to client-side fetches and prevents CORS issues.
const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://cms.magnetomarketing.co/graphql';

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const res = await fetch(WP_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
