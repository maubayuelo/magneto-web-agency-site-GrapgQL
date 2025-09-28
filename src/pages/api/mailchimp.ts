import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

function isValidEmail(email: string) {
  // simple sanity check — good enough for server-side validation
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

function md5(input: string) {
  return crypto.createHash('md5').update(input).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, name } = req.body || {};

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  // If you want to use Mailchimp: set MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID in .env
  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

  try {
    if (MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID) {
      // Mailchimp API expects data-center in the API key after the dash
      const dc = MAILCHIMP_API_KEY.split('-')[1];
      if (!dc) throw new Error('Invalid Mailchimp API key format');

      const basic = Buffer.from(`any:${MAILCHIMP_API_KEY}`).toString('base64');

      // POST to create
      const createUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;
      const body = {
        email_address: email,
        status: 'subscribed', // or 'pending' to require double opt-in
        merge_fields: { FNAME: name || '' },
      };

      let r = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basic}`,
        },
        body: JSON.stringify(body),
      });

      let payload = await r.json().catch(() => ({}));

      // If member already exists, Mailchimp returns 400 with a detail like "... is already a list member. Use PUT to insert or update list members."
      if (!r.ok && typeof payload?.detail === 'string' && payload.detail.toLowerCase().includes('already a list member')) {
        // perform upsert via PUT to members/{subscriber_hash}
        const subscriberHash = md5(String(email).toLowerCase());
        const putUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`;
        r = await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basic}`,
          },
          body: JSON.stringify(body),
        });

        payload = await r.json().catch(() => ({}));
      }

      if (!r.ok) {
        // Mailchimp returns useful error message in payload
        return res.status(r.status || 500).json({ success: false, message: payload?.detail || payload?.title || 'Mailchimp error', payload });
      }

      return res.status(200).json({ success: true, message: 'Subscribed (Mailchimp)', payload });
    }

    // No provider configured: act as a no-op success so UI can continue (useful for local dev)
    // Optionally log/record the submission server-side for debugging
    // eslint-disable-next-line no-console
    console.log('Subscribe (no provider):', { email, name });
    return res.status(200).json({ success: true, message: 'Simulated subscribe (no provider configured)' });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Subscription handler error:', err);
    return res.status(500).json({ success: false, message: String(err?.message || 'Internal server error') });
  }
}
