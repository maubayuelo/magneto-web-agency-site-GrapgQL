import type { NextApiRequest, NextApiResponse } from 'next';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

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
  // Only GET is allowed
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
    // decode if encoded
    const decoded = decodeURIComponent(raw);
    target = new URL(decoded);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid URL' });
  }

  // Security: only allow downloads from configured WP host to avoid SSRF
  const allowedHost = getAllowedHost();
  if (allowedHost) {
    if (target.host !== allowedHost) {
      return res.status(400).json({ success: false, message: 'Target host not allowed' });
    }
  } else {
    // If no WP host configured, be conservative and reject non-localhost hosts
    if (!['localhost', '127.0.0.1'].includes(target.hostname) && !target.hostname.endsWith('.local')) {
      return res.status(400).json({ success: false, message: 'No allowed host configured' });
    }
  }

  try {
    const r = await fetch(target.toString(), { method: 'GET' });
    if (!r.ok || !r.body) {
      // Remote resource not available — return a clear 404/plain-text message so the browser shows it
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(r.status || 404).send('File not found on the source server');
    }

    // If remote returned a body, check content-type. If it's a PDF, stream it.
    const contentType = r.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('pdf')) {
      res.setHeader('X-Download-Source', 'remote');
      res.setHeader('X-Remote-Content-Type', contentType);
      // Derive filename and force attachment
  const pathname = target.pathname || '';
  let name = pathname.split('/').pop() || 'download';
  name = name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
  // Ensure filename ends with .pdf when content-type is PDF
  if (!name.toLowerCase().endsWith('.pdf')) name = `${name}.pdf`;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`);
      res.setHeader('Cache-Control', 'private, max-age=60');
      await streamPipeline((r.body as any), res as any);
      return;
    }

    // If remote resource is not a PDF (maybe it's an image preview), attempt a .pdf sibling
    const src = target.toString();
    const pdfCandidate = src.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '.pdf');
    if (pdfCandidate !== src) {
      try {
        const rc = await fetch(pdfCandidate, { method: 'HEAD' }).catch(() => null);
        let ok = false;
        if (rc && rc.ok) ok = rc.headers.get('content-type')?.toLowerCase().includes('pdf') || false;
        if (!ok) {
          const rc2 = await fetch(pdfCandidate, { method: 'GET' }).catch(() => null);
          if (rc2 && rc2.ok && rc2.body) {
            const ct = rc2.headers.get('content-type') || '';
            if (ct.toLowerCase().includes('pdf')) {
              res.setHeader('X-Download-Source', 'remote-pdf-candidate');
              res.setHeader('X-Remote-Content-Type', ct);
              const pathname = new URL(pdfCandidate).pathname || '';
              let name = pathname.split('/').pop() || 'download';
              name = name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
              if (!name.toLowerCase().endsWith('.pdf')) name = `${name}.pdf`;
              res.setHeader('Content-Type', ct);
              res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`);
              res.setHeader('Cache-Control', 'private, max-age=60');
              await streamPipeline((rc2.body as any), res as any);
              return;
            }
          }
        } else {
          // HEAD said OK and content-type includes pdf
          const getResp = await fetch(pdfCandidate, { method: 'GET' }).catch(() => null);
          if (getResp && getResp.ok && getResp.body) {
            const ct = getResp.headers.get('content-type') || '';
            res.setHeader('X-Download-Source', 'remote-pdf-candidate');
            res.setHeader('X-Remote-Content-Type', ct);
            const pathname = new URL(pdfCandidate).pathname || '';
            let name = pathname.split('/').pop() || 'download';
            name = name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
            if (!name.toLowerCase().endsWith('.pdf')) name = `${name}.pdf`;
            res.setHeader('Content-Type', ct);
            res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`);
            res.setHeader('Cache-Control', 'private, max-age=60');
            await streamPipeline((getResp.body as any), res as any);
            return;
          }
        }
      } catch (err) {
        // ignore and fallback
      }
    }

    // If we got here, the remote resource is not a PDF and no candidate was found.
    // Return a clear 404/plain-text message so the browser displays the error instead of downloading JSON or a placeholder.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(404).send('PDF not found for the requested resource');
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Download proxy error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Internal server error while proxying file' });
    }
    return;
  }
}
