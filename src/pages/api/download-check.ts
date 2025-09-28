import type { NextApiRequest, NextApiResponse } from 'next';

function getAllowedHost(): string | null {
  const env = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!env) return null;
  try {
    const u = new URL(env);
    return u.host;
  } catch (err) {
    return null;
  }
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
    if (target.host !== allowedHost) {
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

    // Try GET as last resort to inspect body headers
    const getResp = await fetch(target.toString(), { method: 'GET' }).catch(() => null);
    if (getResp && getResp.ok) {
      const ct = getResp.headers.get('content-type') || '';
      if (ct.toLowerCase().includes('pdf')) return res.status(200).json({ success: true });
    }

    // Try pdf candidate if this was an image URL
    const src = target.toString();
    const pdfCandidate = src.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '.pdf');
    if (pdfCandidate !== src) {
      const chk = await fetch(pdfCandidate, { method: 'HEAD' }).catch(() => null);
      if (chk && chk.ok && (chk.headers.get('content-type') || '').toLowerCase().includes('pdf')) {
        return res.status(200).json({ success: true, candidate: pdfCandidate });
      }
    }

    return res.status(404).json({ success: false, message: 'PDF not found' });
  } catch (err) {
    console.error('download-check error', err);
    return res.status(500).json({ success: false, message: 'Error checking resource' });
  }
}
