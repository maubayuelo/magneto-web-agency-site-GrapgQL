import { describe, it, expect, afterEach } from 'vitest';
import * as contactApi from '../contact';

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
