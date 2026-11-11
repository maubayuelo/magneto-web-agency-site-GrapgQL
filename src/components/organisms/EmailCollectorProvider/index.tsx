"use client";

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import '@/styles/components/email-collector.scss';
import '@/styles/components/calendly.scss';
import { openCalendlyPopup, type CalendlyPrefill } from '@/utils/calendly';
import { lockPageScroll } from '@/utils/scroll-lock';
import { gtagEvent } from '@/utils/analytics';
import { getUtm } from '@/utils/utm';
import { useI18n } from '@/i18n/I18nProvider';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { format } from '@/i18n/format';
import { localizePath } from '@/i18n/paths';
import { NEED_CODES, NEED_KEYS, type NeedCode } from '@/utils/inquiry';

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

/** 5d-lite §5.2: answer lengths kept short enough for a Calendly URL. */
const BOOKING_LIMITS = { website: 2048, problem: 500 } as const;

export const EmailCollectorProvider: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const { t, locale } = useI18n();
  const tm = t.emailModal;
  const tb = t.bookingModal;
  const tf = t.contactForm;
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [options, setOptions] = useState<ModalOptions | undefined>(undefined);
  const [downloadAvailable, setDownloadAvailable] = useState<boolean | null>(null);
  const [downloadCheckLoading, setDownloadCheckLoading] = useState(false);
  const [downloadChallengeUrl, setDownloadChallengeUrl] = useState<string | null>(null);

  // 5d-lite §6.0 / D-9: native <dialog> + showModal() (top layer, inert page, Escape via `cancel`).
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(false);
  const unlockScrollRef = useRef<(() => void) | null>(null);
  const uid = useId();
  const ids = {
    heading: `${uid}-heading`,
    body: `${uid}-body`,
    website: `${uid}-website`,
    websiteHelp: `${uid}-website-help`,
    need: `${uid}-need`,
    problem: `${uid}-problem`,
    problemHelp: `${uid}-problem-help`,
  };

  const isDownload = Boolean(options?.downloadUrl);

  const openModal = (opts?: ModalOptions) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOptions(opts);
    setError(null);
    setIsOpen(true);
  };

  /** Resets state and returns focus to the trigger (or drops it, when the trigger is gone or hidden). */
  const finishClose = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setIsOpen(false);
    setError(null);
    setIsSubmitting(false);
    setOptions(undefined);
    // Unlock first: restoring the scroll position before focusing keeps the page from jumping to the trigger.
    unlockScrollRef.current?.();
    unlockScrollRef.current = null;
    const trigger = triggerRef.current;
    triggerRef.current = null;
    // Browsers don't focus an element that is removed or not rendered (e.g. inside a mobile menu that closed on
    // click), so "focus landed" is the visibility test. Otherwise focus falls back to <body>.
    if (trigger?.isConnected) trigger.focus();
    if (document.activeElement !== trigger && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  /** Closes synchronously, so focus is back on the trigger before Calendly opens its own overlay. */
  const closeModal = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    finishClose();
  }, [finishClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog || dialog.open) return;
    unlockScrollRef.current = lockPageScroll();
    dialog.showModal();
    openRef.current = true;
    // showModal() focuses the first focusable (the close button); the spec wants the first form control.
    const first = dialog.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea');
    (first ?? document.getElementById(ids.heading))?.focus();
  }, [isOpen, ids.heading]);

  // Never leave the page locked if the provider unmounts with the dialog open.
  useEffect(() => () => unlockScrollRef.current?.(), []);

  // Escape: the browser closes the dialog; keep it open while a download submit is in flight.
  const onCancel: React.ReactEventHandler<HTMLDialogElement> = (e) => {
    if (isSubmitting) e.preventDefault();
  };

  const handleBookingSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const website = String(formData.get('website') || '').trim();
    const need = String(formData.get('need') || '');
    const problem = String(formData.get('problem') || '').trim();

    // a2 = the label the visitor saw, in their language (§5.2).
    const customAnswers: NonNullable<CalendlyPrefill['customAnswers']> = {};
    if (website) customAnswers.a1 = website;
    if ((NEED_CODES as readonly string[]).includes(need)) customAnswers.a2 = tf.needOptions[NEED_KEYS[need as NeedCode]];
    if (problem) customAnswers.a3 = problem;

    const utm = getUtm();
    const opts = options;
    closeModal();

    await openCalendlyPopup({
      utmContent: opts?.utmContent ?? opts?.origin ?? utm?.utm_content,
      utmTerm: opts?.utmTerm ?? utm?.utm_term,
      customUrl: opts?.customUrl,
      forceNewWindow: opts?.forceNewWindow,
      utmParams: utm,
      // EN uses calendly.ts's defaults (the same EN dictionary values).
      ...(locale === DEFAULT_LOCALE ? {} : { labels: t.calendly }),
      ...(Object.keys(customAnswers).length ? { prefill: { customAnswers } } : {}),
    });
  };

  // Download branch (lead magnet, hidden): unchanged behaviour (A5, ADR 0002).
  const handleDownloadSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
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

      // Emit a Mailchimp subscribe event so GA captures the conversion source
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

      // keep the modal open and show a success state with download button
      setSuccess(true);
      const downloadUrl = options?.downloadUrl || '';
      // kick off a quick check to make sure the PDF exists (avoid browser downloading text)
      try {
        setDownloadCheckLoading(true);
        setDownloadChallengeUrl(null);
        fetch(`/api/download-check?url=${encodeURIComponent(downloadUrl)}`)
          .then((r) => r.json().catch(() => ({})))
          .then((p) => {
            if (p && p.success) {
              setDownloadAvailable(true);
              setDownloadChallengeUrl(null);
            } else if (p && p.challenge) {
              // remote requires browser challenge — offer a direct link that lets the browser handle it
              setDownloadAvailable(false);
              setDownloadChallengeUrl(downloadUrl || null);
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
    } catch (err: unknown) {
      console.error('Subscription error:', err);
      setError(err instanceof Error && err.message ? err.message : String(err || tm.errors.unknown));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBooking = () => (
    <>
      <h2 id={ids.heading} className="typo-xl-responsive m-0 ec-heading" tabIndex={-1}>{t.common.bookStrategyCall}</h2>
      <p id={ids.body} className="typo-md-medium">{tb.body}</p>
      <form onSubmit={handleBookingSubmit} className="ec-form" noValidate>
        <div className="form-field">
          <label className="form-field__label" htmlFor={ids.website}>{tf.websiteLabel}</label>
          <input
            id={ids.website}
            name="website"
            className="form-field__control"
            type="text"
            inputMode="url"
            autoComplete="url"
            maxLength={BOOKING_LIMITS.website}
            aria-describedby={ids.websiteHelp}
          />
          <p id={ids.websiteHelp} className="form-field__help">{tb.websiteHelp}</p>
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor={ids.need}>{tf.needLabel}</label>
          <select id={ids.need} name="need" className="form-field__control form-field__select" defaultValue="">
            <option value="" disabled>{tf.selectPlaceholder}</option>
            {NEED_CODES.map((code) => (
              <option key={code} value={code}>{tf.needOptions[NEED_KEYS[code]]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor={ids.problem}>{tb.problemLabel}</label>
          <textarea
            id={ids.problem}
            name="problem"
            className="form-field__control"
            rows={3}
            maxLength={BOOKING_LIMITS.problem}
            aria-describedby={ids.problemHelp}
          />
          <p id={ids.problemHelp} className="form-field__help">{tb.problemHelp}</p>
        </div>
        <p className="ec-privacy">
          {tb.privacyText} <a href={localizePath('/privacy-policy', locale)}>{t.common.privacyPolicy}</a>
        </p>
        <div className="ec-actions">
          <button type="submit" className="btn btn-primary">{tb.continue}</button>
        </div>
      </form>
    </>
  );

  const renderDownload = () => (
    <>
      <h2 id={ids.heading} className="typo-xl-responsive m-0 ec-heading" tabIndex={-1}>{tm.downloadTitle}</h2>
      <p id={ids.body} className="typo-md-medium">{success ? tm.downloadReady : tm.downloadBody}</p>

      {success ? (
        <div className="ec-success">
          <div className="ec-success-actions">
            {downloadCheckLoading ? (
              <button className="btn btn-primary" disabled>{tm.checking}</button>
            ) : downloadAvailable === true ? (
              <a href={options?.downloadUrl ? `/api/download?url=${encodeURIComponent(options.downloadUrl)}` : '#'} className="btn btn-primary" download>
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
        <form onSubmit={handleDownloadSubmit} className="ec-form">
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
              {isSubmitting ? tm.submitting : tm.continueDownload}
            </button>
          </div>
        </form>
      )}
    </>
  );

  return (
    <EmailModalContext.Provider value={{ openModal }}>
      {props.children}

      {isOpen && (
        <dialog
          ref={dialogRef}
          className="ec-dialog"
          aria-modal="true"
          aria-labelledby={ids.heading}
          aria-describedby={ids.body}
          onCancel={onCancel}
          onClose={finishClose}
        >
          <div className="ec-modal">
            <button type="button" className="ec-close" onClick={closeModal} aria-label={t.common.close}>
              <svg className="ec-close__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            {isDownload ? renderDownload() : renderBooking()}
          </div>
        </dialog>
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
