// Project inquiry model (5d-lite §1): one validator shared by ContactForm (before fetch) and /api/contact
// (authoritative). Option codes are stable and never translated; labels come from the dictionaries.
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';

export const NEED_CODES = ['new-site', 'fix-improve', 'care', 'not-sure'] as const;
export const BUDGET_CODES = ['under-1000', '1000-3500', '3500-8000', 'over-8000', 'not-sure'] as const;
export type NeedCode = (typeof NEED_CODES)[number];
export type BudgetCode = (typeof BUDGET_CODES)[number];

/** Dictionary key under `contactForm.needOptions` / `contactForm.budgetOptions` for each code. */
export const NEED_KEYS = {
  'new-site': 'newSite',
  'fix-improve': 'fixImprove',
  care: 'care',
  'not-sure': 'notSure',
} as const satisfies Record<NeedCode, string>;
export const BUDGET_KEYS = {
  'under-1000': 'under1000',
  '1000-3500': 'from1000to3500',
  '3500-8000': 'from3500to8000',
  'over-8000': 'over8000',
  'not-sure': 'notSure',
} as const satisfies Record<BudgetCode, string>;

/** Input `maxLength` values: the same limits as the validator, so length never needs a message. */
export const INQUIRY_LIMITS = { name: 200, email: 254, website: 2048, message: 5000 } as const;

// Same pattern as the previous client check (ContactForm, Phase 4).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InquiryField = 'name' | 'email' | 'website' | 'need' | 'message' | 'budget';
/** Field order = form order: the first invalid field gets focus. */
export const INQUIRY_FIELDS: readonly InquiryField[] = ['name', 'email', 'website', 'need', 'message', 'budget'];

export interface InquiryPayload {
  name: string;
  email: string;
  website?: string;
  need?: NeedCode;
  message: string;
  budget: BudgetCode;
  locale: Locale;
  /** Honeypot (§7): never filled by a person. Not validated here. */
  company?: string;
}

export type InquiryResult = { ok: true; value: InquiryPayload } | { ok: false; fields: InquiryField[] };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const within = (v: string, max: number) => v.length >= 1 && v.length <= max;
const isCode = <T extends string>(codes: readonly T[], v: string): v is T => (codes as readonly string[]).includes(v);

export function validateInquiry(input: unknown): InquiryResult {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = str(raw.name);
  const email = str(raw.email);
  const website = str(raw.website);
  const need = str(raw.need);
  const message = str(raw.message);
  const budget = str(raw.budget);
  const locale = str(raw.locale);

  const fields: InquiryField[] = [];
  if (!within(name, INQUIRY_LIMITS.name)) fields.push('name');
  if (!(email.length <= INQUIRY_LIMITS.email && EMAIL_RE.test(email))) fields.push('email');
  // D-5: optional, length limit only, no format check (example.com is valid input).
  if (website.length > INQUIRY_LIMITS.website) fields.push('website');
  if (!isCode(NEED_CODES, need)) fields.push('need'); // D-4: required
  if (!within(message, INQUIRY_LIMITS.message)) fields.push('message');
  if (!isCode(BUDGET_CODES, budget)) fields.push('budget');

  if (fields.length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: {
      name,
      email,
      ...(website ? { website } : {}),
      need: need as NeedCode,
      message,
      budget: budget as BudgetCode,
      locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
      ...(str(raw.company) ? { company: str(raw.company) } : {}),
    },
  };
}
