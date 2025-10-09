"use client";

import React, { createContext, useContext, useState } from 'react';
import '@/styles/components/email-collector.scss';
import { openCalendlyPopup, warmCalendlyResources } from '@/utils/calendly';
import { gtagEvent } from '@/utils/analytics';
import { getUtm } from '@/utils/utm';

type ModalOptions = {
  utmContent?: string;
  utmTerm?: string;
  customUrl?: string;
  forceNewWindow?: boolean;
  downloadUrl?: string;
  origin?: string; // e.g. 'header','hero','package','finalcta'
};

interface EmailModalContextValue {
  openModal: (opts?: ModalOptions) => void;
}

const EmailModalContext = createContext<EmailModalContextValue | undefined>(undefined);

export const EmailCollectorProvider: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [options, setOptions] = useState<ModalOptions | undefined>(undefined);
  const [downloadAvailable, setDownloadAvailable] = useState<boolean | null>(null);
  const [downloadCheckLoading, setDownloadCheckLoading] = useState(false);
  const [downloadChallengeUrl, setDownloadChallengeUrl] = useState<string | null>(null);

  const openModal = (opts?: ModalOptions) => {
    // If this modal is being opened as part of a Calendly flow, do a lightweight warm
    // (preconnect + preload) so the full Calendly script can load faster on click.
    try {
      const isCalendlyIntent = Boolean(
        opts && (
          (opts.origin && ['header', 'hero', 'package', 'finalcta'].includes(opts.origin)) ||
          (opts.customUrl && typeof opts.customUrl === 'string' && opts.customUrl.includes('calendly')) ||
          (opts.utmContent && String(opts.utmContent).toLowerCase().includes('calendly'))
        )
      );

      if (isCalendlyIntent) warmCalendlyResources();
    } catch (err) {
      // warming is best-effort
    }

    setOptions(opts);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setError(null);
    setIsSubmitting(false);
    setOptions(undefined);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const name = String(formData.get('name') || '').trim();

    if (!email) {
      setError('Please enter a valid email');
      setIsSubmitting(false);
      return;
    }

    try {
      // attach any captured UTM params to the subscribe request
      const utm = getUtm();

      const res = await fetch('/api/mailchimp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, utm }),
      });

      // try to parse JSON (safe)
      const payload = await res.json().catch(() => ({}));

      // Normalize success check: accept HTTP 2xx OR payload.success truthy
      const ok = res.ok || Boolean(payload?.success) || Boolean(payload?.data);

      if (!ok) {
        const msg = payload?.message || payload?.error || payload?.details?.message || `Failed to subscribe (${res.status})`;
        throw new Error(msg);
      }

      // On success: trigger analytics and then continue with UX flow.
      // Emit a Mailchimp subscribe event so GA captures the conversion source (hero/header/package/download/finalcta)
      try {
        gtagEvent('mailchimp_subscribed', {
          event_category: 'engagement',
          event_label: options?.origin || options?.utmContent || utm?.utm_content || 'unknown',
          origin: options?.origin || null,
          utm_content: options?.utmContent || utm?.utm_content || null,
          utm_source: utm?.utm_source || null,
          utm_medium: utm?.utm_medium || null,
          utm_campaign: utm?.utm_campaign || null,
        });
      } catch (e) {
        // best-effort; don't block UX on analytics
      }

      // If modal was opened with a downloadUrl, show success UI and present in-modal download CTA
          if (options?.downloadUrl) {
        // keep the modal open and show a success state with download button
        setSuccess(true);
        // kick off a quick check to make sure the PDF exists (avoid browser downloading text)
        try {
          setDownloadCheckLoading(true);
              setDownloadChallengeUrl(null);
              fetch(`/api/download-check?url=${encodeURIComponent(options.downloadUrl)}`)
                .then((r) => r.json().catch(() => ({})))
                .then((p) => {
                  if (p && p.success) {
                    setDownloadAvailable(true);
                    setDownloadChallengeUrl(null);
                  } else if (p && p.challenge) {
                    // remote requires browser challenge — offer a direct link that lets the browser handle it
                    setDownloadAvailable(false);
                    setDownloadChallengeUrl(options.downloadUrl || null);
                  } else {
                    setDownloadAvailable(false);
                    setDownloadChallengeUrl(null);
                  }
                })
                .catch(() => {
                  setDownloadAvailable(false);
                  setDownloadChallengeUrl(null);
                })
                .finally(() => setDownloadCheckLoading(false));
        } catch (err) {
          setDownloadAvailable(false);
          setDownloadCheckLoading(false);
        }
        // Also send a more specific event for downloads
        try {
          gtagEvent('lead_download_ready', {
            event_category: 'engagement',
            event_label: options?.origin || options?.utmContent || utm?.utm_content || 'download',
            origin: options?.origin || null,
            utm_content: options?.utmContent || utm?.utm_content || null,
            utm_source: utm?.utm_source || null,
            utm_medium: utm?.utm_medium || null,
            utm_campaign: utm?.utm_campaign || null,
            method: 'download'
          });
        } catch (e) {
          // ignore
        }

        return;
      }

      // otherwise continue with existing flow (e.g. open calendly)
      // `openCalendlyPopup` will load the full script if needed; avoid redundant eager loads here.
      // Ensure Calendly receives a sensible utmContent (prefer explicit utmContent, otherwise use origin)
  const calendlyUtmContent = options?.utmContent ?? options?.origin ?? utm?.utm_content;

      try {
        gtagEvent('mailchimp_subscribed_then_calendly', {
          event_category: 'engagement',
          event_label: calendlyUtmContent || 'calendly',
          origin: options?.origin || null,
          utm_content: options?.utmContent || utm?.utm_content || null,
          utm_source: utm?.utm_source || null,
          utm_medium: utm?.utm_medium || null,
          utm_campaign: utm?.utm_campaign || null,
          method: 'calendly'
        });
      } catch (e) {
        // ignore
      }

      await openCalendlyPopup({
        utmContent: calendlyUtmContent,
        utmTerm: options?.utmTerm ?? utm?.utm_term,
        customUrl: options?.customUrl,
        forceNewWindow: options?.forceNewWindow,
        utmParams: utm,
      });

      // close modal after successful flow
      closeModal();
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(String(err?.message || err || 'Subscription failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmailModalContext.Provider value={{ openModal }}>
      {props.children}

      {isOpen && (
        <div className="ec-overlay" role="dialog" aria-modal="true">
          <div className="ec-modal">
            <button className="ec-close" onClick={closeModal} aria-label="Close">×</button>
            {/* Render slightly different copy depending on how the modal was opened */}
            {(() => {
              const strategyOrigins = ['header', 'hero', 'package', 'finalcta'];
              const variant = options?.downloadUrl
                ? 'download'
                : (options?.origin && strategyOrigins.includes(options.origin))
                ? 'calendly'
                : (options?.customUrl && typeof options.customUrl === 'string' && options.customUrl.includes('calendly')) || (options?.utmContent && String(options.utmContent).toLowerCase().includes('calendly'))
                ? 'calendly'
                : 'default';

              if (variant === 'calendly') {
                return (
                  <>
                   <h3 className="typo-xl-responsive m-0">Quick — before we book</h3>
                    <p className="typo-md-medium">Tell us who you are so we can prep a smarter session tailored to your goals.</p>
                  </>
                );
              }

              if (variant === 'download') {
                return (
                  <>
                    <h3 className="typo-xl-responsive m-0">Grab your free guide</h3>
                    
                    {success && options?.downloadUrl ? (
                      <p className="typo-md-medium">Thanks — your guide is ready for you.</p>
                    ) : <p className="typo-md-medium">Enter your name and email, so we can send marketing ideas and tips.</p>}
                  </>
                );
              }

              return (
                <>
                  <h3 className="typo-xl-responsive m-0">Quick — before we book</h3>
                  <p className="typo-md-medium">Enter your name and email so we can send confirmation and reminders.</p>
                </>
              );
            })()}

            {success && options?.downloadUrl ? (
              <div className="ec-success">
                
                <div className="ec-success-actions">
                  {downloadCheckLoading ? (
                    <button className="btn btn-primary" disabled>Checking...</button>
                  ) : downloadAvailable === true ? (
                    <a href={options.downloadUrl ? `/api/download?url=${encodeURIComponent(options.downloadUrl)}` : '#'} className="btn btn-primary" download>
                      Download the free guide
                    </a>
                  ) : downloadChallengeUrl ? (
                    // The server detected a challenge (e.g. Vercel bot protection). Let the browser handle it by opening the direct URL.
                    <a href={downloadChallengeUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                      Open guide in new tab
                    </a>
                  ) : downloadAvailable === false ? (
                    <button className="btn btn-primary" disabled>Download unavailable</button>
                  ) : (
                    // null state (not checked) — show safe disabled state
                    <button className="btn btn-primary" disabled>Preparing download...</button>
                  )}
                  <button className="btn btn-outline" onClick={closeModal}>
                    Close
                  </button>
                </div>
                {downloadAvailable === false && !downloadChallengeUrl && (
                  <div className="form-error" style={{ marginTop: 12 }}>
                    Sorry — we couldn't find the PDF on the source site. If this keeps happening, contact us at contact@magnetomarketing.co
                  </div>
                )}
                {downloadChallengeUrl && (
                  <div className="form-error" style={{ marginTop: 12 }}>
                    The file appears to be protected by the host (bot challenge). Click "Open guide in new tab" to let your browser complete the challenge and download the file.
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ec-form">
                <div className="form-field">
                  <label className="typo-md-bold" htmlFor="ec-name">Name</label>
                  <input
                    id="ec-name"
                    className="form-field__control"
                    type="text"
                    name="name"
                    placeholder="Your name"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label className="typo-md-bold" htmlFor="ec-email">Email</label>
                  <input
                    id="ec-email"
                    className="form-field__control"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {error && <div className="form-error">{error}</div>}

                <div className="ec-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : (options?.downloadUrl ? 'Continue to Download the Guide' : ((options?.origin && ['header','hero','package','finalcta'].includes(options.origin)) || (options?.customUrl && typeof options.customUrl === 'string' && options.customUrl.includes('calendly')) || (options?.utmContent && String(options.utmContent).toLowerCase().includes('calendly'))) ? 'Continue to Book Call' : 'Subscribe')}
                  </button>
                </div>
              </form>
            )}
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
