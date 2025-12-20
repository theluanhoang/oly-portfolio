'use client';

import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  label,
  name,
  placeholder,
  error,
  required = false,
  className: wrapperClassNameProp = '',
  style,
  ...props
}, ref) {
  const textareaId = `textarea-${name}`;
  const hasError = !!error;

  const propsClassName = 'className' in props ? (props.className as string) || '' : '';

  const textareaClassName = `w-full min-h-[44px] px-4 py-3 rounded-lg border bg-white text-[#333] focus:outline-none transition-colors resize-none ${
    hasError
      ? 'border-red-500 focus:border-red-600'
      : 'border-black focus:border-black'
  } ${propsClassName}`;

  const { className: _unused, ...textareaProps } = props as { className?: string; [key: string]: unknown };

  return (
    <div className={wrapperClassNameProp} style={style}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        placeholder={placeholder}
        required={required}
        className={textareaClassName}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${textareaId}-error` : undefined}
        {...textareaProps}
      />
      {hasError && (
        <p
          id={`${textareaId}-error`}
          className="mt-1 text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Textarea;

