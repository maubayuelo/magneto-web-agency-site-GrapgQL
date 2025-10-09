import type { NextApiRequest, NextApiResponse } from 'next';

function getAllowedHost(): string | null {
  // Accept any of the common WP env vars; consider NEXT_PUBLIC_WORDPRESS_API_URL as well
  const raw = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    // Normalize by stripping any trailing path (e.g. /graphql or /wp-json)
    const cleaned = raw.replace(/\/(?:graphql|wp-json|graphql\/?)?$/i, '').replace(/\/$/, '');
    const u = new URL(cleaned);
    return u.host;
  } catch (err) {
    return null;
  }
}

function hostsMatchLoosely(allowedHost: string, targetHost: string): boolean {
  if (!allowedHost || !targetHost) return false;
  // normalize to lower-case
  const a = allowedHost.toLowerCase();
  const t = targetHost.toLowerCase();
  if (a === t) return true;
  // Strip common prefixes like cms., www.
  const strip = (h: string) => h.replace(/^(www\.|cms\.)/i, '');
  return strip(a) === strip(t);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing url query parameter' });
  }

  let target: URL;
  try {
    const decoded = decodeURIComponent(raw);
    target = new URL(decoded);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid URL' });
  }

  const allowedHost = getAllowedHost();
  if (allowedHost) {
    if (!hostsMatchLoosely(allowedHost, target.host)) {
      return res.status(400).json({ success: false, message: 'Target host not allowed' });
    }
  } else {
    if (!['localhost', '127.0.0.1'].includes(target.hostname) && !target.hostname.endsWith('.local')) {
      return res.status(400).json({ success: false, message: 'No allowed host configured' });
    }
  }

  try {
    // Prefer HEAD for speed; fall back to GET if HEAD not allowed
    const head = await fetch(target.toString(), { method: 'HEAD' }).catch(() => null);
    if (head && head.ok) {
      const ct = head.headers.get('content-type') || '';
      if (ct.toLowerCase().includes('pdf')) return res.status(200).json({ success: true });
    }

    // If head failed or returned non-pdf, some hosts block non-browser UA — retry with browser-like headers
    const browserHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36', Referer: target.origin };
    const head2 = await fetch(target.toString(), { method: 'HEAD', headers: browserHeaders }).catch(() => null);
    if (head2 && head2.ok) {
      const ct = head2.headers.get('content-type') || '';
      if (ct.toLowerCase().includes('pdf')) return res.status(200).json({ success: true });
    }
    // If remote indicates bot protection/challenge, return a challenge flag so the client can offer a direct-link fallback
    const maybeChallengeHeader = (head2?.headers.get('x-vercel-mitigated') || head2?.headers.get('x-vercel-challenge-token') || head?.headers.get('x-vercel-mitigated') || head?.headers.get('x-vercel-challenge-token'));
    if (maybeChallengeHeader) {
      return res.status(200).json({ success: false, challenge: true, message: 'Remote host requires browser challenge' });
    }

    // Try GET as last resort to inspect body headers
    const getResp = await fetch(target.toString(), { method: 'GET' }).catch(() => null);
    if (getResp && getResp.ok) {
      const ct = getResp.headers.get('content-type') || '';
      if (ct.toLowerCase().includes('pdf')) return res.status(200).json({ success: true });
    }

    // Retry GET with browser headers (some hosts return 403 to non-browser clients)
    const getResp2 = await fetch(target.toString(), { method: 'GET', headers: browserHeaders }).catch(() => null);
    if (getResp2 && getResp2.ok) {
      const ct = getResp2.headers.get('content-type') || '';
      if (ct.toLowerCase().includes('pdf')) return res.status(200).json({ success: true });
    }
    const maybeChallengeHeader2 = (getResp2?.headers.get('x-vercel-mitigated') || getResp2?.headers.get('x-vercel-challenge-token') || getResp?.headers.get('x-vercel-mitigated') || getResp?.headers.get('x-vercel-challenge-token'));
    if (maybeChallengeHeader2) {
      return res.status(200).json({ success: false, challenge: true, message: 'Remote host requires browser challenge' });
    }

    // Try pdf candidate if this was an image URL
    const src = target.toString();
    const pdfCandidate = src.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '.pdf');
    if (pdfCandidate !== src) {
      const chk = await fetch(pdfCandidate, { method: 'HEAD' }).catch(() => null);
      if (chk && chk.ok && (chk.headers.get('content-type') || '').toLowerCase().includes('pdf')) {
        return res.status(200).json({ success: true, candidate: pdfCandidate });
      }
      // fallback: try HEAD with browser headers
      const chk2 = await fetch(pdfCandidate, { method: 'HEAD', headers: browserHeaders }).catch(() => null);
      if (chk2 && chk2.ok && (chk2.headers.get('content-type') || '').toLowerCase().includes('pdf')) {
        return res.status(200).json({ success: true, candidate: pdfCandidate });
      }
    }

    return res.status(404).json({ success: false, message: 'PDF not found' });
  } catch (err) {
    console.error('download-check error', err);
    return res.status(500).json({ success: false, message: 'Error checking resource' });
  }
}
