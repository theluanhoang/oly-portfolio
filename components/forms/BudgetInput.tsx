'use client';

interface BudgetInputProps {
  label?: string;
  name: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const BudgetInput = ({
  label,
  name,
  placeholder,
  error,
  required = false,
  value = '',
  onChange,
  onBlur,
  onFocus,
}: BudgetInputProps) => {
  const formatNumber = (num: string): string => {
    const cleaned = num.replace(/[^\d]/g, '').replace(/,/g, '');
    if (!cleaned) return '';
    const number = parseInt(cleaned, 10);
    return number.toLocaleString('en-US');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    if (inputValue) {
      const numericValue = inputValue.replace(/,/g, '').trim();
      if (numericValue && !isNaN(parseFloat(numericValue)) && parseFloat(numericValue) > 0) {
        const formatted = formatNumber(numericValue);
        if (onBlur) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: formatted },
          } as React.FocusEvent<HTMLInputElement>;
          onBlur(syntheticEvent);
        }
      } else if (onBlur) {
        onBlur(e);
      }
    } else if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/,/g, '').trim();
    if (onFocus) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: numericValue },
      } as React.FocusEvent<HTMLInputElement>;
      onFocus(syntheticEvent);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^\d]/g, '').replace(/,/g, '');
    
    if (numericValue) {
      const formatted = formatNumber(numericValue);
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: formatted },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    } else {
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
  };

  const inputId = `budget-input-${name}`;
  const hasError = !!error;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type="text"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full h-[44px] px-4 rounded-lg border bg-white text-[#333] focus:outline-none transition-colors ${
          hasError
            ? 'border-red-500 focus:border-red-600'
            : 'border-black focus:border-black'
        }`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
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
};

export default BudgetInput;

