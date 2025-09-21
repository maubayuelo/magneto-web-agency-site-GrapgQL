import type { NextApiRequest, NextApiResponse } from 'next';
import { createBrevoContact } from '@/utils/brevo';

function isValidEmail(email: string) {
  // simple RFC-5322-ish check — good enough for server-side sanity
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { name, email, businessType, message } = req.body || {};
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  try {
    const data = await createBrevoContact({
      email: email.trim(),
      attributes: {
        ...(name ? { FIRSTNAME: String(name).trim() } : {}),
        ...(businessType ? { BUSINESSTYPE: String(businessType).trim() } : {}),
        ...(message ? { MESSAGE: String(message).trim() } : {}),
      },
      updateEnabled: true,
    });

    return res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    console.error('Brevo API error:', err);
    const message = err instanceof Error ? err.message : String(err || 'Brevo error');
    // try to pull `data` if present on the error object
    let details: unknown = null;
    if (err && typeof err === 'object' && 'data' in err) {
      details = (err as { data?: unknown }).data ?? null;
    }
    return res.status(500).json({ success: false, message, details });
  }
}
