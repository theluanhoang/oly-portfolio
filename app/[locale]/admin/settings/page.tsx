'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/forms/Input';
import Button from '@/components/ui/Button';
import { User, Lock, Mail, Shield, Check, X, Image as ImageIcon } from 'lucide-react';
import SingleImageUpload from '@/components/admin/SingleImageUpload';
import { z } from 'zod';
import { validatePassword } from '@/lib/validations/passwordValidation';
import type { ChangePasswordInput } from '@/lib/validations/passwordSchema';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const t = useTranslations('Admin.settings');
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // About Page settings state
  const [shaneImage, setShaneImage] = useState('/assets/creator-1.jpg');
  const [eduardoImage, setEduardoImage] = useState('/assets/creator-2.jpg');
  const [loadingAbout, setLoadingAbout] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutSuccess, setAboutSuccess] = useState('');
  const [aboutError, setAboutError] = useState('');

  useEffect(() => {
    const fetchAboutSettings = async () => {
      try {
        setLoadingAbout(true);
        const res = await fetch('/api/admin/settings/about');
        if (res.ok) {
          const data = await res.json();
          if (data.shaneImage) setShaneImage(data.shaneImage);
          if (data.eduardoImage) setEduardoImage(data.eduardoImage);
        }
      } catch (err) {
        console.error('Failed to fetch about settings:', err);
      } finally {
        setLoadingAbout(false);
      }
    };

    fetchAboutSettings();
  }, []);

  const handleSaveAboutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAboutSuccess('');
    setAboutError('');

    if (!shaneImage?.trim() || !eduardoImage?.trim()) {
      setAboutError(t('aboutPage.validationRequired'));
      return;
    }

    setSavingAbout(true);

    try {
      const res = await fetch('/api/admin/settings/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shaneImage, eduardoImage }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t('aboutPage.error'));
      }

      setAboutSuccess(t('aboutPage.success'));
    } catch (err) {
      console.error('Failed to save about settings:', err);
      setAboutError(err instanceof Error ? err.message : t('aboutPage.error'));
    } finally {
      setSavingAbout(false);
    }
  };

  const schemaWithTranslation = useMemo(
    () => {
      const passwordSchemaWithTranslation = z
        .string()
        .min(8, t('changePassword.validationMinLength'))
        .regex(/[A-Z]/, t('changePassword.validationUppercase'))
        .regex(/[a-z]/, t('changePassword.validationLowercase'))
        .regex(/[0-9]/, t('changePassword.validationNumber'))
        .regex(/[^A-Za-z0-9]/, t('changePassword.validationSpecialChar'));

      return z.object({
        currentPassword: z.string().min(1, t('changePassword.currentPasswordRequired')),
        newPassword: passwordSchemaWithTranslation,
        confirmPassword: z.string().min(1, t('changePassword.confirmPasswordRequired')),
      })
      .refine(
        (data) => data.newPassword === data.confirmPassword,
        {
          message: t('changePassword.passwordsNotMatch'),
          path: ['confirmPassword'],
        }
      )
      .refine(
        (data) => data.currentPassword !== data.newPassword,
        {
          message: t('changePassword.passwordDifferent'),
          path: ['newPassword'],
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
    reset,
    formState: { errors, isValid },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(schemaWithTranslation),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const newPassword = watch('newPassword', '');

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

  const onSubmit = async (data: ChangePasswordInput) => {
    setSuccess('');

    try {
      setIsUpdating(true);
      
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (responseData.fieldErrors && typeof responseData.fieldErrors === 'object') {
          Object.keys(responseData.fieldErrors).forEach((field) => {
            if (field === 'currentPassword' || field === 'newPassword' || field === 'confirmPassword') {
              setError(field as keyof ChangePasswordInput, {
                type: 'server',
                message: responseData.fieldErrors[field],
              });
            }
          });
        } else if (responseData.field) {
          setError(responseData.field as keyof ChangePasswordInput, {
            type: 'server',
            message: responseData.error,
          });
        } else if (responseData.details && Array.isArray(responseData.details)) {
          responseData.details.forEach((err: { field: string; message: string }) => {
            if (err.field === 'currentPassword' || err.field === 'newPassword' || err.field === 'confirmPassword') {
              setError(err.field as keyof ChangePasswordInput, {
                type: 'server',
                message: err.message,
              });
            }
          });
        } else if (responseData.error) {
          const errorMsg = responseData.error.toLowerCase();
          if (errorMsg.includes('current') || errorMsg.includes('incorrect')) {
            setError('currentPassword', {
              type: 'server',
              message: responseData.error,
            });
          } else if (errorMsg.includes('new') || errorMsg.includes('password must') || errorMsg.includes('different')) {
            setError('newPassword', {
              type: 'server',
              message: responseData.error,
            });
          } else if (errorMsg.includes('confirm') || errorMsg.includes('match')) {
            setError('confirmPassword', {
              type: 'server',
              message: responseData.error,
            });
          } else {
            setError('newPassword', {
              type: 'server',
              message: responseData.error || t('changePassword.error'),
            });
          }
        }
        return;
      }
      
      setSuccess(t('changePassword.success'));
      reset();
      setPasswordValidation(null);
      setShowPasswordRequirements(false);
    } catch (err) {
      console.error('Password change error:', err);
      setError('newPassword', {
        type: 'server',
        message: t('changePassword.error'),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-4 sm:pt-6 md:pt-10 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Account Information Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User size={20} className="text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('accountInfo.title')}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <User size={18} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('accountInfo.username')}
                </label>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {session?.user?.name || 'Admin'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Mail size={18} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('accountInfo.email')}
                </label>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {session?.user?.email || 'admin@oly-studio.com'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Shield size={18} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('accountInfo.role')}
                </label>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {(session?.user as { role?: string })?.role || 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Lock size={20} className="text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('changePassword.title')}
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t('changePassword.currentPassword')}
              type="password"
              placeholder="••••••••"
              {...register('currentPassword')}
              required
              error={errors.currentPassword?.message}
            />

            <div>
              <Input
                label={t('changePassword.newPassword')}
                type="password"
                placeholder="••••••••"
                {...register('newPassword')}
                required
                error={errors.newPassword?.message}
              />
              
              {showPasswordRequirements && passwordValidation && (
                <div className="mt-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    {t('changePassword.passwordRequirementsTitle')}
                  </p>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.checks.minLength ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <X size={14} className="shrink-0" />
                      )}
                      <span>{t('changePassword.requirementMinLength')}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.checks.hasUppercase ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <X size={14} className="shrink-0" />
                      )}
                      <span>{t('changePassword.requirementUppercase')}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.checks.hasLowercase ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <X size={14} className="shrink-0" />
                      )}
                      <span>{t('changePassword.requirementLowercase')}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.checks.hasNumber ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <X size={14} className="shrink-0" />
                      )}
                      <span>{t('changePassword.requirementNumber')}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.checks.hasSpecialChar ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <X size={14} className="shrink-0" />
                      )}
                      <span>{t('changePassword.requirementSpecialChar')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Input
              label={t('changePassword.confirmPassword')}
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              required
              error={errors.confirmPassword?.message}
            />

            {success && (
              <div className="px-4 py-3 bg-green-50 border-2 border-green-500 text-green-700 text-sm rounded-lg">
                {success}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isUpdating || !isValid}
                className="min-w-[160px]"
              >
                {isUpdating ? t('changePassword.updating') : t('changePassword.update')}
              </Button>
            </div>
          </form>
        </div>

        {/* About Page Settings Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ImageIcon size={20} className="text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('aboutPage.title')}
            </h2>
          </div>

          {loadingAbout ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <form onSubmit={handleSaveAboutSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('aboutPage.shaneImage')}
                  </label>
                  <SingleImageUpload
                    value={shaneImage}
                    onChange={setShaneImage}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('aboutPage.eduardoImage')}
                  </label>
                  <SingleImageUpload
                    value={eduardoImage}
                    onChange={setEduardoImage}
                  />
                </div>
              </div>

              {aboutSuccess && (
                <div className="px-4 py-3 bg-green-50 border-2 border-green-500 text-green-700 text-sm rounded-lg">
                  {aboutSuccess}
                </div>
              )}

              {aboutError && (
                <div className="px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm rounded-lg">
                  {aboutError}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={savingAbout}
                  className="min-w-[160px]"
                >
                  {savingAbout ? t('aboutPage.saving') : t('aboutPage.save')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
