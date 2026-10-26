"use client";

import React, { createContext, useContext, useState } from 'react';
import '@/styles/components/email-collector.scss';
import { openCalendlyPopup, warmCalendlyResources } from '@/utils/calendly';
import { gtagEvent } from '@/utils/analytics';
import { getUtm } from '@/utils/utm';
import { useI18n } from '@/i18n/I18nProvider';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { format } from '@/i18n/format';

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
  // Strings only (Phase 4, Decision C: ADR 0002 exception). No logic or flow change.
  const { t, locale } = useI18n();
  const tm = t.emailModal;
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
      setError(tm.errors.emailInvalid);
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
        const msg = payload?.message || payload?.error || payload?.details?.message || format(tm.errors.subscribeFailed, { status: res.status });
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
        // EN uses calendly.ts's defaults (the same EN dictionary values).
        ...(locale === DEFAULT_LOCALE ? {} : { labels: t.calendly }),
      });

      // close modal after successful flow
      closeModal();
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(String(err?.message || err || tm.errors.unknown));
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
            <button className="ec-close" onClick={closeModal} aria-label={t.common.close}>×</button>
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
                   <h3 className="typo-xl-responsive m-0">{tm.bookingTitle}</h3>
                    <p className="typo-md-medium">{tm.calendlyBody}</p>
                  </>
                );
              }

              if (variant === 'download') {
                return (
                  <>
                    <h3 className="typo-xl-responsive m-0">{tm.downloadTitle}</h3>
                    
                    {success && options?.downloadUrl ? (
                      <p className="typo-md-medium">{tm.downloadReady}</p>
                    ) : <p className="typo-md-medium">{tm.downloadBody}</p>}
                  </>
                );
              }

              return (
                <>
                  <h3 className="typo-xl-responsive m-0">{tm.bookingTitle}</h3>
                  <p className="typo-md-medium">{tm.defaultBody}</p>
                </>
              );
            })()}

            {success && options?.downloadUrl ? (
              <div className="ec-success">
                
                <div className="ec-success-actions">
                  {downloadCheckLoading ? (
                    <button className="btn btn-primary" disabled>{tm.checking}</button>
                  ) : downloadAvailable === true ? (
                    <a href={options.downloadUrl ? `/api/download?url=${encodeURIComponent(options.downloadUrl)}` : '#'} className="btn btn-primary" download>
                      {tm.download}
                    </a>
                  ) : downloadChallengeUrl ? (
                    // The server detected a challenge (e.g. Vercel bot protection). Let the browser handle it by opening the direct URL.
                    <a href={downloadChallengeUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                      {tm.openInNewTab}
                    </a>
                  ) : downloadAvailable === false ? (
                    <button className="btn btn-primary" disabled>{tm.downloadUnavailable}</button>
                  ) : (
                    // null state (not checked) — show safe disabled state
                    <button className="btn btn-primary" disabled>{tm.preparing}</button>
                  )}
                  <button className="btn btn-outline" onClick={closeModal}>
                    {t.common.close}
                  </button>
                </div>
                {downloadAvailable === false && !downloadChallengeUrl && (
                  <div className="form-error" style={{ marginTop: 12 }}>
                    {tm.pdfNotFound}
                  </div>
                )}
                {downloadChallengeUrl && (
                  <div className="form-error" style={{ marginTop: 12 }}>
                    {tm.botChallenge}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ec-form">
                <div className="form-field">
                  <label className="typo-md-bold" htmlFor="ec-name">{tm.nameLabel}</label>
                  <input
                    id="ec-name"
                    className="form-field__control"
                    type="text"
                    name="name"
                    placeholder={t.forms.namePlaceholder}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label className="typo-md-bold" htmlFor="ec-email">{tm.emailLabel}</label>
                  <input
                    id="ec-email"
                    className="form-field__control"
                    type="email"
                    name="email"
                    placeholder={t.forms.emailPlaceholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {error && <div className="form-error">{error}</div>}

                <div className="ec-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? tm.submitting : (options?.downloadUrl ? tm.continueDownload : ((options?.origin && ['header','hero','package','finalcta'].includes(options.origin)) || (options?.customUrl && typeof options.customUrl === 'string' && options.customUrl.includes('calendly')) || (options?.utmContent && String(options.utmContent).toLowerCase().includes('calendly'))) ? tm.continueBooking : tm.subscribe)}
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

/** Like useEmailModal, but returns undefined outside EmailCollectorProvider instead of throwing. */
export const useOptionalEmailModal = () => useContext(EmailModalContext);

export default EmailCollectorProvider;
