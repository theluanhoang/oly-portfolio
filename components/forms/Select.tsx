'use client';

import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  name: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  options?: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  label,
  name,
  placeholder,
  error,
  required = false,
  className = '',
  style,
  options = [],
  ...props
}, ref) {
  const selectId = `select-${name}`;
  const hasError = !!error;

  const isDisabled = props.disabled;
  const selectClassName = `w-full h-[44px] px-4 rounded-lg border bg-white text-[#333] focus:outline-none transition-colors appearance-none ${
    isDisabled 
      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
      : 'cursor-pointer'
  } ${
    hasError
      ? 'border-red-500 focus:border-red-600'
      : 'border-black focus:border-black'
  } ${className}`;

  return (
    <div className={className} style={style}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          required={required}
          disabled={isDisabled}
          className={selectClassName}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className="w-4 h-4 text-[#666]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {hasError && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;

