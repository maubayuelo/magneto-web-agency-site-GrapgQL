// Calendly CTA Button Component
// src/components/atoms/CalendlyButton/index.tsx

'use client';

import { openCalendlyPopup } from '../../../utils/calendly';

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
}: CalendlyButtonProps) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call additional onClick if provided
    if (onClick) {
      onClick();
    }
    
    // Open Calendly popup
    await openCalendlyPopup({
      utmContent,
      utmTerm,
      customUrl
    });
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
      className={allClasses}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

export default CalendlyButton;
