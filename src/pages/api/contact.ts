import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

function isValidEmail(email: unknown) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

function md5(input: string) {
  return crypto.createHash('md5').update(input).digest('hex');
}

async function subscribeMailchimp(email: string, name?: string) {
  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) return { success: false, message: 'Mailchimp not configured' };

  const dc = MAILCHIMP_API_KEY.split('-')[1];
  if (!dc) throw new Error('Invalid Mailchimp API key format');
  const basic = Buffer.from(`any:${MAILCHIMP_API_KEY}`).toString('base64');
  const body = { email_address: email, status: 'subscribed', merge_fields: { FNAME: name || '' } };

  const createUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;
  let r = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${basic}` },
    body: JSON.stringify(body),
  });

  let payload = await r.json().catch(() => ({}));
  if (!r.ok && typeof payload?.detail === 'string' && payload.detail.toLowerCase().includes('already a list member')) {
    // upsert
    const subscriberHash = md5(String(email).toLowerCase());
    const putUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`;
    r = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${basic}` },
      body: JSON.stringify(body),
    });
    payload = await r.json().catch(() => ({}));
  }

  if (!r.ok) return { success: false, message: payload?.detail || payload?.title || 'Mailchimp error', payload };
  return { success: true, message: 'Subscribed (Mailchimp)', payload };
}

export async function sendEmail(payload: { name?: string; email: string; businessType?: string; message?: string }) {
  try {
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    // If CONTACT_RECIPIENT isn't configured, fall back to the public contact
    // address so form submissions still reach the team. Log a server-side
    // warning so deploying environments can be corrected later.
    const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || 'contact@magnetomarketing.co';

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      // don't completely fail — return a clear error object so callers and
      // logs can show what's missing. Upstream code will decide whether to
      // treat this as fatal based on DISABLE_SMTP.
      console.warn('SMTP configuration is incomplete. SMTP_HOST, SMTP_USER and SMTP_PASS are required to send email. Using CONTACT_RECIPIENT=%s', CONTACT_RECIPIENT);
      return { success: false, message: 'SMTP not configured', details: { SMTP_HOST: Boolean(SMTP_HOST), SMTP_USER: Boolean(SMTP_USER), SMTP_PASS: Boolean(SMTP_PASS), CONTACT_RECIPIENT } };
    }

    // TLS: Do not disable certificate verification.
    // If the SMTP server's certificate name differs from the connection
    // hostname, set SMTP_TLS_SERVERNAME to the expected certificate name.
    // Prefer fixing upstream certificates or using the provider's canonical
    // SMTP hostname in production. This preserves verification while avoiding
    // name mismatches.
    const SMTP_TLS_SERVERNAME = process.env.SMTP_TLS_SERVERNAME || undefined;

    const transportOpts: any = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    };

    if (SMTP_TLS_SERVERNAME) {
      transportOpts.tls = { servername: SMTP_TLS_SERVERNAME };
    }

    const transporter = nodemailer.createTransport(transportOpts);

    const html = `
      <p>New contact form submission</p>
      <ul>
        <li><strong>Name:</strong> ${payload.name || '—'}</li>
        <li><strong>Email:</strong> ${payload.email}</li>
        <li><strong>Business Type:</strong> ${payload.businessType || '—'}</li>
        <li><strong>Message:</strong> ${payload.message || '—'}</li>
      </ul>
    `;

    const fromAddress = process.env.EMAIL_FROM || SMTP_USER;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: CONTACT_RECIPIENT,
      subject: `New contact from ${payload.name || payload.email}`,
      text: `Name: ${payload.name || ''}\nEmail: ${payload.email}\nBusiness: ${payload.businessType || ''}\nMessage: ${payload.message || ''}`,
      html,
    });

    // Return info for debugging in server logs if needed
    return { success: true, message: 'Email sent', info };
  } catch (err: any) {
    // more informative logging for server logs
    console.error('nodemailer sendMail error:', err && (err.stack || err.message || err));
    // Surface a readable error message for the API response & logs
    return { success: false, message: `Failed to send email: ${String(err?.message || err)}` };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { name, email, businessType, message } = req.body || {};

    if (!email || !isValidEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email' });
    // name and businessType are validated clientside; server-side be permissive but warn

    // 1) attempt Mailchimp subscribe (no-op if not configured)
    let mcResult: { success: boolean; message?: string; payload?: unknown } = { success: false, message: 'Mailchimp not configured' };
    try {
      mcResult = await subscribeMailchimp(email, name);
    } catch (err: unknown) {
      // log and continue — subscription shouldn't block form delivery
      // eslint-disable-next-line no-console
      console.error('Mailchimp subscribe error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      mcResult = { success: false, message: msg };
    }

    // 2) send email via SMTP unless explicitly disabled
    const DISABLE_SMTP = String(process.env.DISABLE_SMTP || '').trim() === '1';

    let mailResult: { success: boolean; message?: string; info?: unknown } = { success: false, message: 'Not attempted' };
    if (!DISABLE_SMTP) {
      try {
        mailResult = await sendEmail({ name, email, businessType, message });
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error('Send email error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        mailResult = { success: false, message: msg };
      }
    } else {
      // In local/dev we may only want Mailchimp subscription — avoid failing the request when SMTP is disabled
      mailResult = { success: false, message: 'SMTP disabled via DISABLE_SMTP=1' };
    }

    // Success criteria:
    // - If SMTP is enabled, require mailResult.success
    // - If SMTP disabled, accept Mailchimp success as overall success
    const overallSuccess = !DISABLE_SMTP ? Boolean(mailResult.success) : Boolean(mcResult.success);

    if (!overallSuccess) {
      // Allow an explicit fallback in production for temporary outages by
      // setting ALLOW_CONTACT_FALLBACK=1 in the environment. This keeps the
      // stricter behavior by default but avoids a hard 500 when you know it's
      // safe to accept submissions without delivery.
      const ALLOW_CONTACT_FALLBACK = String(process.env.ALLOW_CONTACT_FALLBACK || '').trim() === '1';

      if (process.env.NODE_ENV !== 'production' || ALLOW_CONTACT_FALLBACK) {
        console.warn('Delivery failed but returning success due to dev-mode or ALLOW_CONTACT_FALLBACK=1. Details:', { mailResult, mcResult, DISABLE_SMTP, allowFallback: ALLOW_CONTACT_FALLBACK });
        return res.status(200).json({ success: true, message: 'Contact submitted (fallback)', details: { mailResult, mcResult, DISABLE_SMTP, allowFallback: ALLOW_CONTACT_FALLBACK } });
      }

      // Return 500 with details so callers and logs can show why
      return res.status(500).json({ success: false, message: 'Failed to deliver contact message', details: { mailResult, mcResult, DISABLE_SMTP } });
    }

    return res.status(200).json({ success: true, message: 'Contact submitted', details: { mailResult, mcResult, DISABLE_SMTP } });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('Contact handler error:', err);
    const msg = err instanceof Error ? err.message : String(err || 'Internal server error');
    return res.status(500).json({ success: false, message: msg });
  }
}
