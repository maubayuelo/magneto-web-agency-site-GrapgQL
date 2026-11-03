"use client";

import React, { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { localizePath } from '@/i18n/paths';
import { CalendlyButton } from '@/components/atoms/CalendlyButton';
import {
  BUDGET_CODES,
  BUDGET_KEYS,
  INQUIRY_FIELDS,
  INQUIRY_LIMITS,
  NEED_CODES,
  NEED_KEYS,
  validateInquiry,
  type InquiryField,
} from '@/utils/inquiry';

type Values = Record<InquiryField, string> & { company: string };
type Status = 'idle' | 'sending' | 'success' | 'failed';
type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const EMPTY: Values = { name: '', email: '', website: '', need: '', message: '', budget: '', company: '' };

// 5d-lite §3: 6-field Project Inquiry form. Validation is shared with /api/contact (utils/inquiry.ts); every
// message is a dictionary string, never server text. Success only after the server confirms.
export const ContactForm: React.FC = () => {
  const { t, locale } = useI18n();
  const tf = t.contactForm;
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;
  const [values, setValues] = useState<Values>(EMPTY);
  const [invalid, setInvalid] = useState<InquiryField[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const refs = useRef<Partial<Record<InquiryField, FieldElement | null>>>({});
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const errorText: Partial<Record<InquiryField, string>> = {
    name: tf.errors.nameRequired,
    email: tf.errors.emailInvalid,
    need: tf.errors.needRequired,
    message: tf.errors.messageRequired,
    budget: tf.errors.budgetRequired,
  };

  const showInvalid = (fields: InquiryField[]) => {
    const ordered = INQUIRY_FIELDS.filter((f) => fields.includes(f));
    setInvalid(ordered);
    if (ordered[0]) refs.current[ordered[0]]?.focus();
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (status === 'sending') return;
    const payload = { ...values, locale };
    const result = validateInquiry(payload);
    if (!result.ok) {
      setStatus('idle');
      showInvalid(result.fields);
      return;
    }
    setInvalid([]);
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result.value, company: values.company }),
      });
      const body: unknown = await res.json().catch(() => null);
      const data = (body && typeof body === 'object' ? body : {}) as { success?: unknown; fields?: unknown };
      if (res.ok && data.success === true) {
        setValues(EMPTY);
        setStatus('success');
        return;
      }
      if (res.status === 400 && Array.isArray(data.fields)) {
        const fields = data.fields.filter((f): f is InquiryField => INQUIRY_FIELDS.includes(f as InquiryField));
        if (fields.length > 0) {
          setStatus('idle');
          showInvalid(fields);
          return;
        }
      }
      setStatus('failed');
    } catch (err: unknown) {
      console.error('ContactForm submit error:', err);
      setStatus('failed');
    }
  };

  const update = (field: keyof Values) => (e: React.ChangeEvent<FieldElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  /** Props shared by every control: id, value, aria-invalid and aria-describedby (helper + error). */
  const control = (field: InquiryField, hasHelp = false) => {
    const isInvalid = invalid.includes(field);
    const describedBy = [hasHelp ? id(`${field}-help`) : '', isInvalid && errorText[field] ? id(`${field}-error`) : '']
      .filter(Boolean)
      .join(' ');
    return {
      id: id(field),
      name: field,
      value: values[field],
      onChange: update(field),
      'aria-invalid': isInvalid || undefined,
      'aria-describedby': describedBy || undefined,
      ref: (el: FieldElement | null) => {
        refs.current[field] = el;
      },
    };
  };

  const label = (field: InquiryField, text: string, required: boolean) => (
    <label className="form-field__label" htmlFor={id(field)}>
      {text}
      {required && <span className="form-field__required" aria-hidden="true">*</span>}
    </label>
  );
  const help = (field: InquiryField, text: string) => <p id={id(`${field}-help`)} className="form-field__help">{text}</p>;
  const error = (field: InquiryField) =>
    invalid.includes(field) && errorText[field] ? (
      <p id={id(`${field}-error`)} className="form-field__error">{errorText[field]}</p>
    ) : null;
  const fieldClass = (field: InquiryField) => `form-field${invalid.includes(field) ? ' form-field--error' : ''}`;

  if (status === 'success') {
    return (
      <div className="form-success contact-form-success" role="status" tabIndex={-1} ref={successRef}>
        <p className="contact-form-success__title">{tf.successTitle}</p>
        <p className="contact-form-success__body">{tf.successBody}</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <p className="contact-form__required-note">{tf.requiredNote}</p>

      <div className={fieldClass('name')}>
        {label('name', tf.nameLabel, true)}
        <input {...control('name')} className="form-field__control" autoComplete="name" maxLength={INQUIRY_LIMITS.name} required aria-required="true" />
        {error('name')}
      </div>

      <div className={fieldClass('email')}>
        {label('email', tf.emailLabel, true)}
        <input {...control('email')} type="email" className="form-field__control" autoComplete="email" maxLength={INQUIRY_LIMITS.email} required aria-required="true" />
        {error('email')}
      </div>

      <div className={fieldClass('website')}>
        {label('website', tf.websiteLabel, false)}
        {/* type="text" + inputMode="url": type="url" would reject "example.com" (D-5). */}
        <input {...control('website', true)} type="text" inputMode="url" className="form-field__control" autoComplete="url" maxLength={INQUIRY_LIMITS.website} />
        {help('website', tf.websiteHelp)}
      </div>

      <div className={fieldClass('need')}>
        {label('need', tf.needLabel, true)}
        <select {...control('need')} className="form-field__control form-field__select" required aria-required="true">
          <option value="" disabled>{tf.selectPlaceholder}</option>
          {NEED_CODES.map((code) => (
            <option key={code} value={code}>{tf.needOptions[NEED_KEYS[code]]}</option>
          ))}
        </select>
        {error('need')}
      </div>

      <div className={fieldClass('message')}>
        {label('message', tf.messageLabel, true)}
        <textarea {...control('message', true)} className="form-field__control" rows={5} maxLength={INQUIRY_LIMITS.message} required aria-required="true" />
        {help('message', tf.messageHelp)}
        {error('message')}
      </div>

      <div className={fieldClass('budget')}>
        {label('budget', tf.budgetLabel, true)}
        <select {...control('budget', true)} className="form-field__control form-field__select" required aria-required="true">
          <option value="" disabled>{tf.selectPlaceholder}</option>
          {BUDGET_CODES.map((code) => (
            <option key={code} value={code}>{tf.budgetOptions[BUDGET_KEYS[code]]}</option>
          ))}
        </select>
        {help('budget', tf.budgetHelp)}
        {error('budget')}
      </div>

      {/* Honeypot (§7): off-screen, not announced, not focusable. People never fill it. */}
      <div className="contact-form__hp" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={update('company')} />
      </div>

      {status === 'failed' && <SendFailedAlert text={tf.errors.sendFailed} cta={tf.errors.sendFailedCta} />}

      <button type="submit" className="btn btn-primary contact-form-submit" disabled={status === 'sending'} aria-busy={status === 'sending'}>
        {tf.submit}
      </button>

      <p className="contact-form__privacy">
        {tf.privacyText} <a href={localizePath('/privacy-policy', locale)}>{t.common.privacyPolicy}</a>
      </p>
    </form>
  );
};

/** The full sendFailed text, with its booking phrase (sendFailedCta) rendered as a button that opens the booking modal (A6). */
function SendFailedAlert({ text, cta }: { text: string; cta: string }) {
  const at = text.indexOf(cta);
  if (at < 0) {
    if (process.env.NODE_ENV === 'development') console.warn('contactForm.errors.sendFailedCta is not part of sendFailed');
    return <div className="form-error" role="alert">{text}</div>;
  }
  return (
    <div className="form-error" role="alert">
      {text.slice(0, at)}
      <CalendlyButton variant="secondary" size="sm" className="form-error__cta" utmContent="contact_send_failed" utmTerm="strategy_call">
        {cta}
      </CalendlyButton>
      {text.slice(at + cta.length)}
    </div>
  );
}

export default ContactForm;
