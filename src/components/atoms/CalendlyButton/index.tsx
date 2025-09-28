// Calendly CTA Button Component
// src/components/atoms/CalendlyButton/index.tsx

 'use client';

import { useState } from 'react';
import { openCalendlyPopup, loadCalendlyScript, warmCalendlyResources } from '@/utils/calendly';
import { gtagEvent } from '@/utils/analytics';
import { useEmailModal } from '@/components/organisms/EmailCollectorProvider';
export interface CalendlyButtonProps {
  children: React.ReactNode;
  className?: string;
  utmContent?: string;
  utmTerm?: string;
  customUrl?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void; // Additional onClick handler
  /** If true, open Calendly in a new tab/window instead of the embedded popup. */
  forceNewWindow?: boolean;
  /** If true, skip the email collector and open Calendly immediately */
  skipCollector?: boolean;
}

export function CalendlyButton({
  children,
  className = '',
  utmContent,
  utmTerm,
  customUrl,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
  ,
  forceNewWindow
  ,skipCollector = false
}: CalendlyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  let openModal: ((opts?: any) => void) | undefined;
  try {
    // Attempt to read email modal; guard for usage outside provider
    openModal = useEmailModal().openModal;
  } catch (e) {
    openModal = undefined;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (disabled || isLoading) return;

    // Call additional onClick if provided
    if (onClick) {
      onClick();
    }

    try {
      // best-effort CTA click tracking for Calendly CTAs
      gtagEvent('cta_clicked', { event_category: 'engagement', event_label: utmContent || 'calendly_cta', utm_content: utmContent || null });
    } catch (e) {
      // ignore
    }

    // If forced to open in new window or skipCollector requested, open Calendly directly
    if (forceNewWindow || skipCollector || !openModal) {
      setIsLoading(true);
      try {
        await openCalendlyPopup({ utmContent, utmTerm, customUrl, forceNewWindow });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Otherwise, open the email collector modal which will handle subscribing then opening Calendly
    try {
      openModal({ utmContent, utmTerm, customUrl, forceNewWindow });
    } catch (err) {
      // fallback to direct open
      setIsLoading(true);
      try {
        await openCalendlyPopup({ utmContent, utmTerm, customUrl, forceNewWindow });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Preload Calendly script on hover/focus to reduce perceived wait time
  const handlePreload = () => {
    // Warm resources on intent (preconnect + preload). This is cheap and
    // avoids executing heavy 3rd-party JS until the user clicks.
    try {
      warmCalendlyResources();
    } catch (e) {
      // swallow
    }
  };

  // Build CSS classes
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size !== 'md' ? `btn-${size}` : '';
  const disabledClasses = disabled ? 'btn-disabled' : '';
  
  const allClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
      className={allClasses}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      type="button"
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

export default CalendlyButton;
