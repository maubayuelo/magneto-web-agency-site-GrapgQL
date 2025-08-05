'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  type = 'text',
  placeholder,
  required = false,
  value,
  onChange,
  options,
  rows = 4,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            name={id}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={handleChange}
            rows={rows}
            className="form-field__control"
          />
        );
      case 'select':
        return (
          <select
            id={id}
            name={id}
            required={required}
            value={value}
            onChange={handleChange}
            className="form-field__control form-field__select"
          >
            <option value="" disabled>
              {placeholder || 'Select option'}
            </option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={type}
            id={id}
            name={id}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={handleChange}
            className="form-field__control"
          />
        );
    }
  };

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id} className="form-field__label">
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};
