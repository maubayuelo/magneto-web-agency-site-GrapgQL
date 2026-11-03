/// <reference types="vitest" />
import { BUDGET_CODES, INQUIRY_LIMITS, NEED_CODES, validateInquiry } from './inquiry';

const valid = { name: 'Ana', email: 'ana@example.com', need: 'care', message: 'Slow site', budget: 'not-sure', locale: 'fr' };

describe('validateInquiry', () => {
  it('accepts a valid inquiry, trims values and keeps the locale', () => {
    const r = validateInquiry({ ...valid, name: '  Ana  ', message: ' Slow site \n' });
    expect(r).toEqual({ ok: true, value: { name: 'Ana', email: 'ana@example.com', need: 'care', message: 'Slow site', budget: 'not-sure', locale: 'fr' } });
  });

  it('website is optional and tolerant: empty, example.com, www.example.com, https://… (D-5)', () => {
    for (const website of ['', '   ', 'example.com', 'www.example.com', 'https://example.com/a?b=1', 'not a url']) {
      expect(validateInquiry({ ...valid, website }).ok, website).toBe(true);
    }
    expect(validateInquiry({ ...valid, website: 'example.com' })).toMatchObject({ value: { website: 'example.com' } });
    expect(validateInquiry({ ...valid, website: '' })).not.toHaveProperty('value.website');
  });

  it('website: length limit only', () => {
    expect(validateInquiry({ ...valid, website: 'a'.repeat(INQUIRY_LIMITS.website) }).ok).toBe(true);
    expect(validateInquiry({ ...valid, website: 'a'.repeat(INQUIRY_LIMITS.website + 1) })).toEqual({ ok: false, fields: ['website'] });
  });

  it('name: required, 1–200', () => {
    expect(validateInquiry({ ...valid, name: '  ' })).toEqual({ ok: false, fields: ['name'] });
    expect(validateInquiry({ ...valid, name: 'a'.repeat(200) }).ok).toBe(true);
    expect(validateInquiry({ ...valid, name: 'a'.repeat(201) })).toEqual({ ok: false, fields: ['name'] });
  });

  it('email: the client pattern, ≤ 254', () => {
    for (const email of ['', 'ana', 'ana@', 'ana@example', 'a b@example.com']) {
      expect(validateInquiry({ ...valid, email }), email).toEqual({ ok: false, fields: ['email'] });
    }
    expect(validateInquiry({ ...valid, email: `${'a'.repeat(242)}@example.com` }).ok).toBe(true); // 254
    expect(validateInquiry({ ...valid, email: `${'a'.repeat(243)}@example.com` })).toEqual({ ok: false, fields: ['email'] });
  });

  it('need: required, one of the codes (D-4)', () => {
    for (const need of NEED_CODES) expect(validateInquiry({ ...valid, need }).ok, need).toBe(true);
    expect(validateInquiry({ ...valid, need: '' })).toEqual({ ok: false, fields: ['need'] });
    expect(validateInquiry({ ...valid, need: 'A new website or rebuild' })).toEqual({ ok: false, fields: ['need'] });
  });

  it('message: required, 1–5000', () => {
    expect(validateInquiry({ ...valid, message: '' })).toEqual({ ok: false, fields: ['message'] });
    expect(validateInquiry({ ...valid, message: 'a'.repeat(5000) }).ok).toBe(true);
    expect(validateInquiry({ ...valid, message: 'a'.repeat(5001) })).toEqual({ ok: false, fields: ['message'] });
  });

  it('budget: required, one of the codes incl. not-sure', () => {
    for (const budget of BUDGET_CODES) expect(validateInquiry({ ...valid, budget }).ok, budget).toBe(true);
    expect(validateInquiry({ ...valid, budget: undefined })).toEqual({ ok: false, fields: ['budget'] });
  });

  it('locale: falls back to en', () => {
    for (const locale of [undefined, '', 'de', 'EN']) {
      expect(validateInquiry({ ...valid, locale })).toMatchObject({ ok: true, value: { locale: 'en' } });
    }
  });

  it('lists every invalid field in form order; non-object input', () => {
    expect(validateInquiry({})).toEqual({ ok: false, fields: ['name', 'email', 'need', 'message', 'budget'] });
    expect(validateInquiry(null)).toEqual({ ok: false, fields: ['name', 'email', 'need', 'message', 'budget'] });
    expect(validateInquiry({ ...valid, name: 42, email: ['x'] })).toEqual({ ok: false, fields: ['name', 'email'] });
  });

  it('keeps a filled honeypot for the handler', () => {
    expect(validateInquiry({ ...valid, company: 'Bot Inc' })).toMatchObject({ ok: true, value: { company: 'Bot Inc' } });
  });
});
