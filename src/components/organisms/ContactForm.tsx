"use client";

import React, { useState } from 'react';

const BUSINESS_OPTIONS = [
  { value: 'Coach', label: 'Coach' },
  { value: 'Therapist', label: 'Therapist' },
  { value: 'Ecommerce', label: 'Ecommerce' },
  { value: 'Real State', label: 'Real State' },
  { value: 'Other', label: 'Other' },
];

export const ContactForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (e: string) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError('Please enter your name.');
    if (!validateEmail(email.trim())) return setError('Please enter a valid email address.');
    if (!businessType) return setError('Please select a business type.');

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          businessType: businessType,
          message: message.trim() || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      const msg = payload?.message || (payload && typeof payload === 'object' && 'details' in payload ? (payload as { details?: { message?: string } }).details?.message : undefined) || 'Failed to submit form';
      if (!res.ok || !payload?.success) {
        throw new Error(msg);
      }

      setSuccess("Thanks! We'll get back to you within 24–48 hours.");
      setName('');
      setEmail('');
      setBusinessType('');
      setMessage('');
    } catch (err: unknown) {
  console.error('ContactForm submit error:', err);
      const msg = err instanceof Error ? err.message : String(err || 'Submission failed');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} aria-label="Contact form">
      <div className="form-field">
        <label className="form-field__label" htmlFor="scf-name">Name<span className="form-field__required">*</span></label>
        <input id="scf-name" name="name" className="form-field__control" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="scf-email">Email Address<span className="form-field__required">*</span></label>
        <input id="scf-email" name="email" type="email" className="form-field__control" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="scf-business">Business Type<span className="form-field__required">*</span></label>
        <select id="scf-business" name="businessType" className="form-field__control form-field__select" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required>
          <option value="" disabled>Choose an option</option>
          {BUSINESS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="scf-message">Message (optional)</label>
        <textarea id="scf-message" name="message" className="form-field__control" rows={4} placeholder="A short note about your project" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}
      {success && <div className="form-success" role="status">{success}</div>}

      <button type="submit" className="btn btn-primary contact-form-submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};

export default ContactForm;
