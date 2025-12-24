'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Input, Select, Textarea, BudgetInput } from '@/components/forms';
import Button from '@/components/ui/Button';

type ContactFormData = {
  customerName: string;
  email: string;
  phone: string;
  category: string;
  location?: string;
  area?: string;
  budget?: string;
  notes?: string;
};

export default function ContactForm() {
  const t = useTranslations('ContactPage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [areaValue, setAreaValue] = useState('');
  const [budgetValue, setBudgetValue] = useState('');

  const contactFormSchema = useMemo(
    () =>
      z.object({
        customerName: z
          .string()
          .trim()
          .min(2, t('form.errors.customerNameRequired')),
        email: z
          .string()
          .min(1, t('form.errors.emailRequired'))
          .email(t('form.errors.emailInvalid')),
        phone: z
          .string()
          .min(1, t('form.errors.phoneRequired'))
          .refine(
            (val) => {
              const cleaned = val.replace(/\s/g, '');
              return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(cleaned);
            },
            { message: t('form.errors.phoneInvalid') }
          )
          .transform((val) => val.replace(/\s/g, '')),
        category: z
          .string()
          .min(1, t('form.errors.categoryRequired')),
        location: z.string().optional(),
        area: z.string().optional(),
        budget: z.string().optional(),
        notes: z.string().optional(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    const checkAutofill = () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
      const nameInput = document.querySelector('input[name="customerName"]') as HTMLInputElement;
      
      if (emailInput?.value) {
        const computedStyle = window.getComputedStyle(emailInput);
        if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || emailInput.value.length > 0) {
          setValue('email', emailInput.value, { shouldValidate: true });
          trigger('email');
        }
      }
      if (phoneInput?.value) {
        const computedStyle = window.getComputedStyle(phoneInput);
        if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || phoneInput.value.length > 0) {
          setValue('phone', phoneInput.value, { shouldValidate: true });
          trigger('phone');
        }
      }
      if (nameInput?.value) {
        const computedStyle = window.getComputedStyle(nameInput);
        if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || nameInput.value.length > 0) {
          setValue('customerName', nameInput.value, { shouldValidate: true });
          trigger('customerName');
        }
      }
    };

    const handleInput = () => {
      setTimeout(checkAutofill, 100);
    };

    document.addEventListener('input', handleInput);
    
    setTimeout(() => {
      checkAutofill();
    }, 500);

    return () => {
      document.removeEventListener('input', handleInput);
    };
  }, [setValue, trigger]);

  const handleAreaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value) {
      const numericValue = value.replace(/[^\d.,]/g, '').replace(',', '.').trim();
      if (numericValue && !isNaN(parseFloat(numericValue)) && parseFloat(numericValue) > 0) {
        setAreaValue(numericValue);
        setValue('area', numericValue);
      } else {
        setAreaValue(value);
        setValue('area', value);
      }
    } else {
      setAreaValue('');
      setValue('area', '');
    }
  };

  const handleAreaFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAreaValue(value);
    setValue('area', value);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAreaValue(value);
    setValue('area', value);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBudgetValue(value);
    setValue('budget', value);
  };

  const handleBudgetBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBudgetValue(value);
    setValue('budget', value);
  };

  const handleBudgetFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBudgetValue(value);
    setValue('budget', value);
  };

  const onSubmit = async (data: ContactFormData) => {
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
    const nameInput = document.querySelector('input[name="customerName"]') as HTMLInputElement;
    
    if (emailInput?.value && emailInput.value !== getValues('email')) {
      setValue('email', emailInput.value, { shouldValidate: true });
    }
    if (phoneInput?.value && phoneInput.value !== getValues('phone')) {
      setValue('phone', phoneInput.value, { shouldValidate: true });
    }
    if (nameInput?.value && nameInput.value !== getValues('customerName')) {
      setValue('customerName', nameInput.value, { shouldValidate: true });
    }

    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    const finalData = getValues();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        reset();
        setAreaValue('');
        setBudgetValue('');
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('form.categories.select') },
      { value: 'residential', label: t('form.categories.residential') },
      { value: 'commercial', label: t('form.categories.commercial') },
      { value: 'office', label: t('form.categories.office') },
      { value: 'other', label: t('form.categories.other') },
    ],
    [t]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
      <Input
        label={t('form.customerName')}
        {...register('customerName', {
          onBlur: () => trigger('customerName'),
        })}
        placeholder={t('form.placeholders.customerName')}
        error={errors.customerName?.message}
        required
      />

      <Input
        label={t('form.email')}
        type="email"
        {...register('email', {
          onBlur: () => trigger('email'),
        })}
        placeholder={t('form.placeholders.email')}
        error={errors.email?.message}
        required
      />

      <Input
        label={t('form.phone')}
        type="tel"
        {...register('phone', {
          onBlur: () => trigger('phone'),
        })}
        placeholder={t('form.placeholders.phone')}
        error={errors.phone?.message}
        required
      />

      <Select
        label={t('form.category')}
        {...register('category')}
        options={categoryOptions}
        placeholder={t('form.placeholders.category')}
        error={errors.category?.message}
        required
      />

      <Input
        label={t('form.location')}
        {...register('location')}
        placeholder={t('form.placeholders.location')}
      />

      <Input
        label={t('form.area')}
        name="area"
        placeholder={t('form.placeholders.area')}
        value={areaValue}
        onChange={handleAreaChange}
        onBlur={handleAreaBlur}
        onFocus={handleAreaFocus}
      />

      <BudgetInput
        label={t('form.budget')}
        name="budget"
        placeholder={t('form.placeholders.budget')}
        value={budgetValue}
        onChange={handleBudgetChange}
        onBlur={handleBudgetBlur}
        onFocus={handleBudgetFocus}
      />

      <Textarea
        label={t('form.notes')}
        {...register('notes')}
        placeholder={t('form.placeholders.notes')}
        rows={6}
      />

      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{t('form.messages.success')}</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{t('form.messages.error')}</p>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-[113px] py-[5px]! flex justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center text-[12px] font-normal disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
        >
          {isSubmitting ? t('form.messages.submitting') : t('form.submit')}
        </Button>
      </div>
    </form>
  );
}

