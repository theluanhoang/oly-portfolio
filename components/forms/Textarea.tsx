'use client';

import { forwardRef, useState, useCallback, useEffect, useRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  multilinePlaceholder?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  label,
  name,
  placeholder,
  error,
  required = false,
  className: wrapperClassNameProp = '',
  style,
  multilinePlaceholder = false,
  ...props
}, ref) {
  const textareaId = `textarea-${name}`;
  const hasError = !!error;
  const [value, setValue] = useState('');
  const [, setIsFocused] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  const propsClassName = 'className' in props ? (props.className as string) || '' : '';

  const { className: _unused, onChange, onFocus, onBlur, value: propsValue, style: propsStyle, ...textareaProps } = props as { 
    className?: string; 
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    value?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  };

  const prevPropsValueRef = useRef<string | undefined>(propsValue);

  useEffect(() => {
    if (!multilinePlaceholder || !placeholder || !textareaRef) {
      return;
    }

    const measureHeight = () => {
      if (placeholderRef.current && textareaRef) {
        const textareaWidth = textareaRef.offsetWidth;
        if (placeholderRef.current) {
          placeholderRef.current.style.width = `${textareaWidth - 32}px`; // Subtract padding (16px * 2)
        }
        
        const placeholderHeight = placeholderRef.current.scrollHeight;
        const padding = 24;
        const calculatedMinHeight = placeholderHeight + padding;
        setMinHeight(calculatedMinHeight);
      }
    };

    // Check if propsValue changed (especially when form resets)
    const propsValueChanged = prevPropsValueRef.current !== propsValue;
    if (propsValueChanged) {
      prevPropsValueRef.current = propsValue;
    }

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(measureHeight);
    }, 0);

    // Add ResizeObserver to recalculate when textarea size changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(measureHeight);
    });

    if (textareaRef) {
      resizeObserver.observe(textareaRef);
    }

    // If propsValue changed, trigger an additional measurement after DOM updates
    if (propsValueChanged) {
      const delayedMeasurement = setTimeout(() => {
        requestAnimationFrame(measureHeight);
      }, 100);
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(delayedMeasurement);
        resizeObserver.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [multilinePlaceholder, placeholder, textareaRef, value, propsValue]);

  const minHeightStyle = minHeight !== undefined 
    ? { minHeight: `${minHeight}px` }
    : {};

  const textareaClassName = `w-full min-h-[44px] px-4 py-3 rounded-lg border bg-white text-[#333] focus:outline-none transition-colors resize-none ${
    hasError
      ? 'border-red-500 focus:border-red-600'
      : 'border-black focus:border-black'
  } ${propsClassName}`;

  const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
    setTextareaRef(node);
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    if (node) {
      setValue(node.value || '');
    }
  }, [ref]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (textareaRef) {
      setValue(textareaRef.value || '');
    }
    onBlur?.(e);
  };

  const displayValue = propsValue !== undefined ? String(propsValue || '') : value;
  const actualValue = textareaRef?.value || displayValue;
  const showPlaceholder = multilinePlaceholder && !actualValue;

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
      <div className="relative">
        <textarea
          ref={setRefs}
          id={textareaId}
          name={name}
          placeholder={multilinePlaceholder ? '' : placeholder}
          required={required}
          className={textareaClassName}
          style={{ ...minHeightStyle, ...propsStyle }}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${textareaId}-error` : undefined}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...(propsValue !== undefined ? { value: displayValue } : {})}
          {...textareaProps}
        />
        {showPlaceholder && placeholder && (
          <>
            <div 
              ref={placeholderRef}
              className="absolute top-3 left-4 right-4 text-gray-400 pointer-events-none whitespace-pre-line leading-relaxed invisible"
              style={{ 
                color: '#9ca3af',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                lineHeight: 'inherit'
              }}
            >
              {placeholder}
            </div>
            <div 
              className="absolute top-3 left-4 right-4 text-gray-400 pointer-events-none whitespace-pre-line leading-relaxed"
              style={{ 
                color: '#9ca3af',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                lineHeight: 'inherit'
              }}
            >
              {placeholder}
            </div>
          </>
        )}
      </div>
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

