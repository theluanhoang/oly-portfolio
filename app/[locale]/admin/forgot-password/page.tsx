'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Input from '@/components/forms/Input';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations('Admin.forgotPassword');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-locale': locale,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || t('error.general'));
      }
    } catch (err) {
      setError(t('error.general'));
    } finally {
      setIsLoading(false);
    }
  };

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
              <Link
                href="/admin/login"
                className="block text-center text-sm text-[#333] hover:underline"
              >
                {t('backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label={t('email')}
                name="email"
                type="email"
                placeholder="admin@oly-studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={error ? '' : undefined}
              />

              {error && (
                <div className="px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
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

