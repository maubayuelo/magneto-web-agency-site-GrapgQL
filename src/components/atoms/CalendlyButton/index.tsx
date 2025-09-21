// Calendly CTA Button Component
// src/components/atoms/CalendlyButton/index.tsx

 'use client';

import { useState } from 'react';
import { openCalendlyPopup, loadCalendlyScript } from '@/utils/calendly';
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
}: CalendlyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (disabled || isLoading) return;

    // Call additional onClick if provided
    if (onClick) {
      onClick();
    }

    setIsLoading(true);
    try {
      await openCalendlyPopup({
        utmContent,
        utmTerm,
        customUrl,
        forceNewWindow
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Preload Calendly script on hover/focus to reduce perceived wait time
  const handlePreload = () => {
    // fire-and-forget; avoid throwing
    try {
      loadCalendlyScript().catch(() => {});
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
