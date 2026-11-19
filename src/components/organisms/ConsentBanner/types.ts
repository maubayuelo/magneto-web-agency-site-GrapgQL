import type React from 'react';

/** hidden: no banner · first: no valid choice yet · reopened: opened from the footer "Privacy choices" control. */
export type ConsentMode = 'hidden' | 'first' | 'reopened';

export interface PrivacyChoicesValue {
  /** True only when the build has a valid GA4 Measurement ID. */
  configured: boolean;
  bannerVisible: boolean;
  /** Reopens the banner; `trigger` gets focus back on Escape / a reopened choice. */
  openPreferences: (trigger: HTMLElement | null) => void;
}

export interface ConsentProviderProps {
  children: React.ReactNode;
}
