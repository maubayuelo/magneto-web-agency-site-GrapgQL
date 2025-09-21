"use client";

import React, { createContext, useContext, useState } from 'react';
import '@/styles/components/email-collector.scss';
import { openCalendlyPopup, loadCalendlyScript } from '@/utils/calendly';

type ModalOptions = {
  utmContent?: string;
  utmTerm?: string;
  customUrl?: string;
  forceNewWindow?: boolean;
};

interface EmailModalContextValue {
  openModal: (opts?: ModalOptions) => void;
}

const EmailModalContext = createContext<EmailModalContextValue | undefined>(undefined);

export const EmailCollectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [options, setOptions] = useState<ModalOptions | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const openModal = (opts?: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setName('');
    setEmail('');
    setError(null);
    setIsSubmitting(false);
    setOptions(undefined);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, email }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) {
        const msg = payload?.message || payload?.details?.message || 'Failed to subscribe';
        throw new Error(msg);
      }

      // After successful subscription, open Calendly (if provided)
      await loadCalendlyScript().catch(() => {});
      await openCalendlyPopup({
        utmContent: options?.utmContent,
        utmTerm: options?.utmTerm,
        customUrl: options?.customUrl,
        forceNewWindow: options?.forceNewWindow,
      });

      closeModal();
    } catch (err: any) {
      console.error('Brevo API error:', err);
      setError(err?.message || String(err) || 'Subscription failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmailModalContext.Provider value={{ openModal }}>
      {children}

      {isOpen && (
        <div className="ec-overlay" role="dialog" aria-modal="true">
          <div className="ec-modal">
            <button className="ec-close" onClick={closeModal} aria-label="Close">×</button>
            <h3 className="ec-title">Quick — before we book</h3>
            <p className="ec-sub">Enter your name and email so we can send confirmation and reminders.</p>

            <form className="ec-form" onSubmit={handleSubmit}>
              <label className="ec-field">
                <span className="ec-label">Name</span>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              <label className="ec-field">
                <span className="ec-label">Email</span>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </label>

              {error && <div className="ec-error" role="alert">{error}</div>}

              <div className="ec-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Continue to booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmailModalContext.Provider>
  );
};

export const useEmailModal = () => {
  const ctx = useContext(EmailModalContext);
  if (!ctx) throw new Error('useEmailModal must be used within EmailCollectorProvider');
  return ctx;
};

export default EmailCollectorProvider;
