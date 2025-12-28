'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name?: string;
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
  className: wrapperClassNameProp = '',
  style,
  ...props
}, ref) {
  const t = useTranslations('Common');
  const inputId = `input-${name || 'input'}`;
  const hasError = !!error;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const propsClassName = 'className' in props ? (props.className as string) || '' : '';

  const inputClassName = type === 'file' 
    ? propsClassName
    : `w-full h-[44px] ${isPassword ? 'pl-4 pr-12' : 'px-4'} rounded-lg border bg-white text-[#333] focus:outline-none transition-colors ${
        hasError
          ? 'border-red-500 focus:border-red-600'
          : 'border-black focus:border-black'
      } ${propsClassName}`;

  const { className: _className, ...inputProps } = props as { className?: string; [key: string]: unknown };

  const wrapperClassName = type === 'file' && !label 
    ? (propsClassName || wrapperClassNameProp)
    : wrapperClassNameProp;

  const displayType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={wrapperClassName} style={style}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={displayType}
          placeholder={placeholder}
          required={required}
          className={inputClassName}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={18} className="shrink-0" />
            ) : (
              <Eye size={18} className="shrink-0" />
            )}
          </button>
        )}
      </div>
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

