import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { en } from '@/i18n/dictionaries/en';
import { BUDGET_KEYS, NEED_KEYS, validateInquiry, type InquiryPayload } from '@/utils/inquiry';

// src/types/nodemailer.d.ts declares neither `tls` nor `replyTo`; both are standard nodemailer options.
type TransportOptions = Parameters<typeof nodemailer.createTransport>[0] & { tls?: { servername: string } };
type MailOptions = Parameters<ReturnType<typeof nodemailer.createTransport>['sendMail']>[0] & { replyTo: string };

// Response contract (5d-lite §2), consumed only by ContactForm. No response carries error text, delivery
// details or env information: the detail stays in the server logs.
type ContactResponse =
  | { success: true; delivered?: false }
  | { success: false; code: 'method' | 'validation' | 'delivery' | 'server'; fields?: string[] };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The inquiry as label/value rows. Need and budget use the EN labels: the email is internal. */
function inquiryRows(inquiry: InquiryPayload): [string, string][] {
  const tf = en.contactForm;
  return [
    ['Name', inquiry.name],
    ['Email', inquiry.email],
    ['Website', inquiry.website || '—'],
    ['Need', inquiry.need ? tf.needOptions[NEED_KEYS[inquiry.need]] : '—'],
    ['Problem / goal', inquiry.message],
    ['Budget', tf.budgetOptions[BUDGET_KEYS[inquiry.budget]]],
    ['Form language', inquiry.locale],
  ];
}

export async function sendEmail(inquiry: InquiryPayload) {
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
      // Internal result only (server logs, tests): the handler never forwards `details` to the browser.
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

    const transportOpts: TransportOptions = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      ...(SMTP_TLS_SERVERNAME ? { tls: { servername: SMTP_TLS_SERVERNAME } } : {}),
    };

    const transporter = nodemailer.createTransport(transportOpts);

    const rows = inquiryRows(inquiry);
    const html = `
      <p>New project inquiry</p>
      <ul>
        ${rows.map(([label, value]) => `<li><strong>${label}:</strong> ${escapeHtml(value).replace(/\r?\n/g, '<br>')}</li>`).join('\n        ')}
      </ul>
    `;

    const mailOptions: MailOptions = {
      from: process.env.EMAIL_FROM || SMTP_USER,
      to: CONTACT_RECIPIENT,
      replyTo: inquiry.email,
      // CR/LF stripped: the name must not be able to start a new header line.
      subject: `New project inquiry — ${inquiry.name.replace(/[\r\n]+/g, ' ')}`,
      text: rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
      html,
    };
    const info = await transporter.sendMail(mailOptions);

    return { success: true, message: 'Email sent', info };
  } catch (err: unknown) {
    console.error('nodemailer sendMail error:', err instanceof Error ? err.stack || err.message : err);
    return { success: false, message: 'Failed to send email' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ContactResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, code: 'method' });
  }

  try {
    const body: unknown = req.body;
    const honeypot = body && typeof body === 'object' ? (body as Record<string, unknown>).company : undefined;
    if (typeof honeypot === 'string' && honeypot.trim()) {
      // Silent success: bots get no signal. No PII in the log.
      console.warn('Contact honeypot filled: inquiry dropped');
      return res.status(200).json({ success: true });
    }

    const result = validateInquiry(body);
    if (!result.ok) return res.status(400).json({ success: false, code: 'validation', fields: result.fields });

    // Local dry-run, checked before any transport is created. Never set in Vercel.
    if (String(process.env.DISABLE_SMTP || '').trim() === '1') {
      console.warn('DISABLE_SMTP=1: inquiry not delivered');
      return res.status(200).json({ success: true, delivered: false });
    }

    const mail = await sendEmail(result.value);
    if (!mail.success) {
      console.error('Contact delivery failed:', mail.message);
      return res.status(500).json({ success: false, code: 'delivery' });
    }
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ success: false, code: 'server' });
  }
}
