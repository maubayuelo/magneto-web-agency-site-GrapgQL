import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import * as contactApi from '../../pages/api/contact';
import handler from '../../pages/api/contact';

const sendMail = vi.fn();
vi.mock('nodemailer', () => {
  const createTransport = vi.fn(() => ({ sendMail }));
  return { default: { createTransport }, createTransport };
});

describe('contact API sendEmail fallback', () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('returns SMTP not configured with fallback CONTACT_RECIPIENT when CONTACT_RECIPIENT unset', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.CONTACT_RECIPIENT;

    const payload = await (contactApi as any).sendEmail({ name: 'Test', email: 'test@example.com' });

    expect(payload).toBeDefined();
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('SMTP not configured');
    expect(payload.details).toBeDefined();
    expect(payload.details.CONTACT_RECIPIENT).toBe('contact@magnetomarketing.co');
  });

  it('respects explicit CONTACT_RECIPIENT env var when provided', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.CONTACT_RECIPIENT = 'team@customdomain.test';

    const payload = await (contactApi as any).sendEmail({ name: 'Test', email: 'test@example.com' });

    expect(payload).toBeDefined();
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('SMTP not configured');
    expect(payload.details).toBeDefined();
    expect(payload.details.CONTACT_RECIPIENT).toBe('team@customdomain.test');
  });
});

// Handler-level tests (5d-lite §10, AC-2, AC-7). Placeholder env values only.
const SECRETS = { SMTP_HOST: 'smtp.test.invalid', SMTP_USER: 'user-placeholder', SMTP_PASS: 'pass-placeholder', SMTP_PORT: '587', CONTACT_RECIPIENT: 'inbox@recipient.test', EMAIL_FROM: 'from@sender.test' };
const VALID = { name: 'Ana', email: 'ana@example.com', website: 'example.com', need: 'fix-improve', message: 'Slow site', budget: '1000-3500', locale: 'es' };

function call(method: string, body?: unknown) {
  const res = { statusCode: 0, body: undefined as unknown, headers: {} as Record<string, string> };
  const api = {
    setHeader: (k: string, v: string) => { res.headers[k] = v; return api; },
    status: (code: number) => { res.statusCode = code; return api; },
    json: (b: unknown) => { res.body = b; return api; },
  };
  return handler({ method, body } as NextApiRequest, api as unknown as NextApiResponse).then(() => res);
}

describe('/api/contact handler', () => {
  const OLD_ENV = { ...process.env };
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let logs: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    process.env = { ...OLD_ENV, ...SECRETS };
    delete process.env.DISABLE_SMTP;
    delete process.env.ALLOW_CONTACT_FALLBACK;
    sendMail.mockReset().mockResolvedValue({ messageId: 'x' });
    vi.mocked(nodemailer.createTransport).mockClear();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    logs = [vi.spyOn(console, 'warn').mockImplementation(() => {}), vi.spyOn(console, 'error').mockImplementation(() => {})];
  });
  afterEach(() => {
    process.env = { ...OLD_ENV };
    fetchSpy.mockRestore();
    logs.forEach((s) => s.mockRestore());
  });

  it('(a) OQ-3: with MAILCHIMP_* set, a valid POST sends one email and never calls Mailchimp (AC-2)', async () => {
    process.env.MAILCHIMP_API_KEY = 'x-us1';
    process.env.MAILCHIMP_LIST_ID = 'y';
    const res = await call('POST', VALID);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls.some(([url]) => /api\.mailchimp\.com/.test(String(url)))).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('(b) 405 for non-POST', async () => {
    const res = await call('GET');
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(res.body).toEqual({ success: false, code: 'method' });
  });

  it('(c) invalid → 400 + fields, no email', async () => {
    const res = await call('POST', { ...VALID, name: '', need: 'Other', budget: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, code: 'validation', fields: ['name', 'need', 'budget'] });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('(d) honeypot filled → silent 200, no email', async () => {
    const res = await call('POST', { ...VALID, company: 'Bot Inc' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(sendMail).not.toHaveBeenCalled();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('(e) DISABLE_SMTP=1 → 200 delivered:false, no transport created', async () => {
    process.env.DISABLE_SMTP = '1';
    const res = await call('POST', VALID);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, delivered: false });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('(f) sendMail rejects → 500 delivery, no details/message/env values in the body', async () => {
    sendMail.mockRejectedValue(new Error(`connect ECONNREFUSED ${SECRETS.SMTP_HOST} ${SECRETS.SMTP_USER}`));
    const res = await call('POST', VALID);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ success: false, code: 'delivery' });
    const text = JSON.stringify(res.body);
    for (const value of Object.values(SECRETS)) expect(text).not.toContain(value);
    expect(text).not.toMatch(/details|message/);
  });

  it('(f2) SMTP not configured → 500 delivery without env flags', async () => {
    delete process.env.SMTP_HOST;
    const res = await call('POST', VALID);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ success: false, code: 'delivery' });
  });

  it('(g) NODE_ENV=development / ALLOW_CONTACT_FALLBACK=1 + failure → still 500 (fallbacks gone, D-7)', async () => {
    sendMail.mockRejectedValue(new Error('boom'));
    vi.stubEnv('NODE_ENV', 'development');
    process.env.ALLOW_CONTACT_FALLBACK = '1';
    const res = await call('POST', VALID);
    vi.unstubAllEnvs();
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ success: false, code: 'delivery' });
  });

  it('(g2) unexpected throw → 500 server, no error text', async () => {
    vi.mocked(nodemailer.createTransport).mockImplementationOnce(() => { throw new Error('secret detail'); });
    const res = await call('POST', VALID);
    expect(res.statusCode).toBe(500);
    // sendEmail catches transport errors → delivery; either way no text leaks.
    expect(JSON.stringify(res.body)).not.toContain('secret detail');
  });

  it('(h) HTML escaped, replyTo = submitter, subject without CR/LF, EN labels for codes, 6 fields + language', async () => {
    const res = await call('POST', {
      ...VALID,
      name: 'Ana <b>x</b>\r\nBcc: evil@example.com',
      message: 'Line 1 <script>alert(1)</script>\nLine 2 & "q"',
    });
    expect(res.statusCode).toBe(200);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe(SECRETS.CONTACT_RECIPIENT);
    expect(mail.from).toBe(SECRETS.EMAIL_FROM);
    expect(mail.replyTo).toBe('ana@example.com');
    expect(mail.subject).toBe('New project inquiry — Ana <b>x</b> Bcc: evil@example.com');
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>x</b>');
    expect(mail.html).toContain('Ana &lt;b&gt;x&lt;/b&gt;');
    expect(mail.html).toContain('Line 1 &lt;script&gt;alert(1)&lt;/script&gt;<br>Line 2 &amp; &quot;q&quot;');
    expect(mail.html).toContain('<strong>Need:</strong> Fix or improve my current website');
    expect(mail.html).toContain('<strong>Budget:</strong> Around C$1,000–3,500');
    expect(mail.html).toContain('<strong>Form language:</strong> es');
    expect(mail.text.split('\n').map((l: string) => l.split(':')[0])).toEqual(
      expect.arrayContaining(['Name', 'Email', 'Website', 'Need', 'Problem / goal', 'Budget', 'Form language']),
    );
    expect(mail.text).toContain('Website: example.com');
  });

  it('source has no Mailchimp reference (AC-2)', async () => {
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const src = readFileSync(path.resolve(__dirname, '../../pages/api/contact.ts'), 'utf8');
    expect(src).not.toMatch(/mailchimp/i);
  });
});
