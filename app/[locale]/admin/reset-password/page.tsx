'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter as useIntlRouter } from '@/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/forms/Input';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { Check, X } from 'lucide-react';
import { z } from 'zod';
import { validatePassword } from '@/lib/validations/passwordValidation';

interface ResetPasswordInput {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const intlRouter = useIntlRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Admin.resetPassword');
  const [token, setToken] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const schemaWithTranslation = useMemo(
    () => {
      const passwordSchemaWithTranslation = z
        .string()
        .min(8, t('error.passwordTooWeak'))
        .regex(/[A-Z]/, t('error.passwordTooWeak'))
        .regex(/[a-z]/, t('error.passwordTooWeak'))
        .regex(/[0-9]/, t('error.passwordTooWeak'))
        .regex(/[^A-Za-z0-9]/, t('error.passwordTooWeak'));

      return z.object({
        newPassword: passwordSchemaWithTranslation,
        confirmPassword: z.string().min(1, t('error.confirmPasswordRequired')),
      })
      .refine(
        (data) => data.newPassword === data.confirmPassword,
        {
          message: t('error.passwordsNotMatch'),
          path: ['confirmPassword'],
        }
      );
    },
    [t]
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schemaWithTranslation),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const newPassword = watch('newPassword', '');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordValidation(validation);
      setShowPasswordRequirements(true);
      
      if (validation.isValid) {
        clearErrors('newPassword');
      }
    } else {
      setPasswordValidation(null);
      setShowPasswordRequirements(false);
    }
  }, [newPassword, clearErrors]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setError('newPassword', { message: t('error.tokenInvalid') });
      return;
    }

    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          intlRouter.push('/admin/login');
        }, 2000);
      } else {
        if (responseData.field) {
          setError(responseData.field as keyof ResetPasswordInput, {
            message: responseData.error || t('error.general'),
          });
        } else {
          setError('newPassword', {
            message: responseData.error || t('error.general'),
          });
        }
      }
    } catch (err) {
      setError('newPassword', {
        message: t('error.general'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#e0e0e0] p-8 md:p-6">
            <div className="mb-8 text-center">
              <Link
                href="/"
                className="inline-block text-2xl font-bold tracking-[3px] px-5 py-2 border-2 border-[#333] text-[#333] mb-6"
              >
                OLY
              </Link>
              <h1 className="text-2xl font-normal tracking-[2px] uppercase text-[#333] mb-2">
                {t('title')}
              </h1>
            </div>
            <div className="px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm">
              {t('error.tokenInvalid')}
            </div>
            <div className="text-center mt-6">
              <Link
                href="/admin/login"
                className="text-sm text-[#333] hover:underline"
              >
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e0e0e0] p-8 md:p-6">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block text-2xl font-bold tracking-[3px] px-5 py-2 border-2 border-[#333] text-[#333] mb-6"
            >
              OLY
            </Link>
            <h1 className="text-2xl font-normal tracking-[2px] uppercase text-[#333] mb-2">
              {t('title')}
            </h1>
            <p className="text-sm text-[#666]">
              {t('subtitle')}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="px-4 py-3 bg-green-50 border-2 border-green-500 text-green-700 text-sm">
                {t('success')}
              </div>
              <p className="text-sm text-center text-[#666]">
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label={t('newPassword')}
                  type="password"
                  placeholder="••••••••"
                  {...register('newPassword')}
                  required
                  error={errors.newPassword?.message}
                />
                
                {showPasswordRequirements && passwordValidation && (
                  <div className="mt-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      {t('passwordRequirementsTitle')}
                    </p>
                    <div className="space-y-1.5">
                      <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.checks.minLength ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <X size={14} className="shrink-0" />
                        )}
                        <span>{t('requirementMinLength')}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.checks.hasUppercase ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <X size={14} className="shrink-0" />
                        )}
                        <span>{t('requirementUppercase')}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.checks.hasLowercase ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <X size={14} className="shrink-0" />
                        )}
                        <span>{t('requirementLowercase')}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.checks.hasNumber ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <X size={14} className="shrink-0" />
                        )}
                        <span>{t('requirementNumber')}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation.checks.hasSpecialChar ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <X size={14} className="shrink-0" />
                        )}
                        <span>{t('requirementSpecialChar')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Input
                label={t('confirmPassword')}
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                required
                error={errors.confirmPassword?.message}
              />

              <Button
                type="submit"
                disabled={isLoading || !token || !isValid}
                className="w-full"
              >
                {isLoading ? t('submitting') : t('submit')}
              </Button>

              <div className="text-center">
                <Link
                  href="/admin/login"
                  className="text-sm text-[#333] hover:underline"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

