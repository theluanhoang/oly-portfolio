'use client';

import { useFormContext, type FieldErrors, type FieldError } from 'react-hook-form';
import Input from './Input';
import Select from './Select';

interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  options?: SelectOption[];
  [key: string]: unknown;
}

export default function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  options,
  ...props
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const getNestedError = (errorObj: FieldErrors, path: string): string | undefined => {
    const parts = path.split('.');
    let current: FieldError | FieldErrors | undefined = errorObj;
    for (const part of parts) {
      if (current && typeof current === 'object' && 'message' in current) {
        return undefined;
      }
      if (current && typeof current === 'object' && part in current) {
        current = (current as FieldErrors)[part] as FieldError | FieldErrors | undefined;
      } else {
        return undefined;
      }
    }
    if (current && typeof current === 'object' && 'message' in current) {
      return (current as FieldError).message;
    }
    return undefined;
  };

  const error = getNestedError(errors, name) || errors[name]?.message as string | undefined;

  if (type === 'select' || options) {
    const { name: _unused, ...registerProps } = register(name);
    return (
      <Select
        label={label}
        name={name}
        placeholder={placeholder}
        required={required}
        error={error}
        className={className}
        options={options || []}
        {...registerProps}
        {...props}
      />
    );
  }

  const { name: _unused, ...registerProps } = register(name);
  return (
    <Input
      label={label}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      error={error}
      className={className}
      {...registerProps}
      {...props}
    />
  );
}

