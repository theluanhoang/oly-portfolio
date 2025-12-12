'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required = false,
  className = '',
  style,
  ...props
}, ref) {
  const inputId = `input-${name}`;
  const hasError = !!error;

  const inputClassName = type === 'file' 
    ? props.className || ''
    : `w-full px-4 py-3 border bg-white text-[#333] focus:outline-none transition-colors ${
        hasError
          ? 'border-red-500 focus:border-red-600'
          : 'border-[#e0e0e0] focus:border-[#333]'
      } ${props.className || ''}`;

  const { className: _, ...inputProps } = props;

  const wrapperClassName = type === 'file' && !label 
    ? (props.className || className)
    : className;

  return (
    <div className={wrapperClassName} style={style}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[#666] tracking-[1px] uppercase mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className={inputClassName}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        {...inputProps}
      />
      {hasError && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;

