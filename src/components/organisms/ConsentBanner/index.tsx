'use client';
// Phase 5f §5 (ADR 0007): consent provider + non-modal "Privacy choices" banner.
// - Renders null on the server and on the first client render, then decides in useEffect (no hydration mismatch,
//   no consent decision on the server). Children always render.
// - Not a dialog: no focus trap, no backdrop, no scroll lock. Ignoring it equals rejecting (nothing loads).
// - The banner comes before {children} in the DOM, so it is reached right after the skip link, though shown at the
//   bottom. A native <dialog> opened with showModal() makes it inert; the Calendly overlay (z-index 10000) covers it.
import './ConsentBanner.scss';
import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { localizePath } from '@/i18n/paths';
import { disableAnalytics, isAnalyticsConfigured, loadAnalytics } from '@/utils/analytics';
import {
  type ConsentChoice,
  type ConsentRecord,
  clearMemoryConsent,
  getEffectiveConsent,
  isRelevantStorageEvent,
  msUntilExpiry,
  writeConsent,
} from '@/utils/consent';
import type { ConsentMode, ConsentProviderProps, PrivacyChoicesValue } from './types';

const MAX_TIMEOUT_MS = 2_147_483_647;
const BUTTON_CLASS = 'btn btn-secondary btn-large consent-banner__button';

const INACTIVE: PrivacyChoicesValue = { configured: false, bannerVisible: false, openPreferences: () => {} };
const PrivacyChoicesContext = createContext<PrivacyChoicesValue>(INACTIVE);

/** Footer control access. Outside a provider (or unconfigured) it is inert. */
export const usePrivacyChoices = (): PrivacyChoicesValue => useContext(PrivacyChoicesContext);

/** Connected, rendered, enabled, not inert / hidden. `body` never counts as a focus destination. */
function isUsable(el: Element | null | undefined): el is HTMLElement {
  if (!(el instanceof HTMLElement) || !el.isConnected) return false;
  if (el === document.body || el === document.documentElement) return false;
  if (el.closest('[inert], [hidden], [aria-hidden="true"]')) return false;
  if ('disabled' in el && (el as HTMLButtonElement).disabled) return false;
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

/** The booking <dialog> or the Calendly overlay owns focus while open: never take it from them. */
const overlayOpen = () => !!document.querySelector('dialog[open], .calendly-modal');

function focusMainFallback() {
  const main = document.getElementById('main-content') ?? document.querySelector('main');
  if (!(main instanceof HTMLElement)) return;
  if (!main.hasAttribute('tabindex')) {
    // Temporary programmatic target only; restore the original (absent) attribute on blur.
    main.setAttribute('tabindex', '-1');
    main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
  }
  main.focus();
}

function focusPageFallback(captured: HTMLElement | null) {
  if (isUsable(captured)) {
    captured.focus();
    return;
  }
  const headerLink = Array.from(document.querySelectorAll<HTMLElement>('header a[href]')).find(isUsable);
  if (headerLink) {
    headerLink.focus();
    return;
  }
  focusMainFallback();
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const { locale, t } = useI18n();
  const configured = isAnalyticsConfigured();
  const headingId = useId();
  const bodyId = useId();

  const [mode, setMode] = useState<ConsentMode>('hidden');
  const [seq, setSeq] = useState(0); // re-runs the post-commit focus effect even when the mode doesn't change

  const modeRef = useRef<ConsentMode>('hidden');
  const bannerRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const lastPageFocusRef = useRef<HTMLElement | null>(null);
  const focusHeadingRef = useRef(false);
  const restoreRef = useRef<'trigger' | 'page' | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconcileRef = useRef<(source: 'mount' | 'storage' | 'check') => void>(() => {});

  const commitMode = useCallback((next: ConsentMode) => {
    modeRef.current = next;
    setMode(next);
    setSeq((n) => n + 1);
  }, []);

  /** Hide; restore focus after the commit only if it was inside the banner (otherwise leave it where it is). */
  const hide = useCallback(() => {
    if (modeRef.current === 'hidden') return;
    const banner = bannerRef.current;
    const inside = !!banner && banner.contains(document.activeElement);
    restoreRef.current = inside ? (modeRef.current === 'reopened' ? 'trigger' : 'page') : null;
    commitMode('hidden');
  }, [commitMode]);

  const scheduleExpiry = useCallback((record: ConsentRecord | null) => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    expiryTimerRef.current = null;
    if (!record) return;
    const delay = Math.min(Math.max(msUntilExpiry(record), 0), MAX_TIMEOUT_MS);
    expiryTimerRef.current = setTimeout(() => reconcileRef.current('check'), delay);
  }, []);

  /**
   * §2 fail-closed transition, always from a fresh read of the current choice (never from an event payload), so a
   * queued old grant cannot override a newer withdrawal. Never writes back, never refreshes `at`.
   */
  const reconcile = useCallback(
    (source: 'mount' | 'storage' | 'check') => {
      const record = getEffectiveConsent();
      scheduleExpiry(record);
      if (record) {
        if (record.analytics === 'granted') void loadAnalytics();
        else disableAnalytics();
        // A reopened banner stays open on a mere revalidation; a choice from another tab closes it.
        if (modeRef.current === 'first' || (source === 'storage' && modeRef.current === 'reopened')) hide();
        return;
      }
      disableAnalytics();
      if (modeRef.current !== 'first') commitMode('first'); // no autofocus
    },
    [commitMode, hide, scheduleExpiry],
  );
  reconcileRef.current = reconcile;

  useEffect(() => {
    if (!configured) return; // Version B: no storage read, no cookie access, nothing rendered
    const onStorage = (event: StorageEvent) => {
      if (!isRelevantStorageEvent(event)) return;
      clearMemoryConsent(); // a newer choice from elsewhere replaces an unsaved local one
      reconcileRef.current('storage');
    };
    const onReturn = () => {
      if (document.visibilityState === 'visible') reconcileRef.current('check');
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target !== document.body && !bannerRef.current?.contains(target)) {
        lastPageFocusRef.current = target;
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    document.addEventListener('focusin', onFocusIn);
    reconcileRef.current('mount');
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
      document.removeEventListener('focusin', onFocusIn);
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    };
  }, [configured]);

  // Focus after the DOM commit: heading on reopen; on hide, the footer trigger (reopened) or the page fallback (first).
  useEffect(() => {
    if (mode === 'reopened' && focusHeadingRef.current) {
      focusHeadingRef.current = false;
      headingRef.current?.focus();
      return;
    }
    if (mode !== 'hidden' || !restoreRef.current) return;
    const kind = restoreRef.current;
    restoreRef.current = null;
    if (overlayOpen()) return;
    const active = document.activeElement;
    if (active && active !== document.body) return; // focus already moved elsewhere: leave it
    if (kind === 'trigger' && isUsable(triggerRef.current)) {
      triggerRef.current.focus();
      return;
    }
    focusPageFallback(lastPageFocusRef.current);
  }, [mode, seq]);

  // WCAG 2.2 2.4.11: keep focused elements scrollable above the fixed banner. Scroll padding handles the page body;
  // the extra body bottom padding lets the last elements (footer links) scroll above the banner too, since scroll
  // padding can't scroll past the document end. Both only extend the end of the page: nothing already laid out moves.
  useEffect(() => {
    if (mode === 'hidden') return;
    const banner = bannerRef.current;
    if (!banner) return;
    const root = document.documentElement;
    const body = document.body;
    const previous = root.style.scrollPaddingBottom;
    const previousBodyPadding = body.style.paddingBottom;
    const basePadding = parseFloat(window.getComputedStyle(body).paddingBottom) || 0;
    const apply = () => {
      const covered = Math.ceil(Math.max(0, window.innerHeight - banner.getBoundingClientRect().top));
      root.style.scrollPaddingBottom = `${covered}px`;
      body.style.paddingBottom = `${basePadding + covered}px`;
    };
    apply();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    observer?.observe(banner);
    window.addEventListener('resize', apply);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', apply);
      root.style.scrollPaddingBottom = previous;
      body.style.paddingBottom = previousBodyPadding;
    };
  }, [mode]);

  const choose = useCallback(
    (choice: ConsentChoice) => {
      const record = writeConsent(choice); // never throws; a failed write holds for this page
      if (choice === 'granted') void loadAnalytics();
      else disableAnalytics();
      scheduleExpiry(record);
      hide();
    },
    [hide, scheduleExpiry],
  );

  const openPreferences = useCallback(
    (trigger: HTMLElement | null) => {
      if (!configured) return;
      triggerRef.current = trigger;
      focusHeadingRef.current = true;
      commitMode('reopened');
    },
    [commitMode, configured],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // Only while focus is inside the reopened banner (keydown bubbles from inside), so a dialog's Escape is untouched.
    if (event.key === 'Escape' && modeRef.current === 'reopened') {
      event.stopPropagation();
      hide();
    }
  };

  const visible = configured && mode !== 'hidden';
  const value = useMemo<PrivacyChoicesValue>(
    () => ({ configured, bannerVisible: visible, openPreferences }),
    [configured, visible, openPreferences],
  );

  return (
    <PrivacyChoicesContext.Provider value={value}>
      {visible ? (
        <section
          ref={bannerRef}
          className="consent-banner"
          aria-labelledby={headingId}
          aria-describedby={bodyId}
          onKeyDown={onKeyDown}
        >
          <div className="consent-banner__text">
            <h2 id={headingId} ref={headingRef} tabIndex={-1} className="consent-banner__title typo-lg-bold">
              {t.consent.privacyChoices}
            </h2>
            <p id={bodyId} className="consent-banner__body typo-md-medium">
              {t.consent.body}
            </p>
          </div>
          <div className="consent-banner__actions">
            {/* D-F5 A: identical class, size and weight for Accept and Reject; Accept first, as in the copy.
                btn-large = existing md type token (14 / 15 / 16 px): consent copy must stay readable (checkpoint Q4). */}
            <button type="button" className={BUTTON_CLASS} onClick={() => choose('granted')}>
              {t.consent.accept}
            </button>
            <button type="button" className={BUTTON_CLASS} onClick={() => choose('denied')}>
              {t.consent.reject}
            </button>
            <a href={localizePath('/privacy-policy', locale)} className="consent-banner__link typo-md-medium">
              {t.common.privacyPolicy}
            </a>
          </div>
        </section>
      ) : null}
      {children}
    </PrivacyChoicesContext.Provider>
  );
}

export default ConsentProvider;
