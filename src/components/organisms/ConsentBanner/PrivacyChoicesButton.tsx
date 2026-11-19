'use client';
// Phase 5f §5: footer "Privacy choices" control. A <button>, not an <a>: it opens UI and goes nowhere (the copy calls
// it a "link"; it is styled like the other footer links). Rendered by the server Footer only when analytics is
// configured, so the label is in the server HTML and causes no shift.
import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { usePrivacyChoices } from './index';

export function PrivacyChoicesButton() {
  const { t } = useI18n();
  const { bannerVisible, openPreferences } = usePrivacyChoices();
  return (
    <button
      type="button"
      className="footer__link footer__link--button"
      aria-expanded={bannerVisible}
      onClick={(event) => openPreferences(event.currentTarget)}
    >
      {t.consent.privacyChoices}
    </button>
  );
}

export default PrivacyChoicesButton;
