'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Input from '@/components/forms/Input';
import Button from '@/components/ui/Button';
import { User, Lock, Mail, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const t = useTranslations('Admin.settings');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword.trim()) {
      setError(t('changePassword.currentPasswordRequired'));
      return;
    }
    if (!newPassword.trim()) {
      setError(t('changePassword.newPasswordRequired'));
      return;
    }
    if (!confirmPassword.trim()) {
      setError(t('changePassword.confirmPasswordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.passwordsNotMatch'));
      return;
    }

    try {
      setIsUpdating(true);
      // TODO: Implement API call to update password
      // const res = await fetch('/api/admin/change-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPassword, newPassword }),
      // });
      // if (!res.ok) throw new Error('Failed to update password');
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(t('changePassword.success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(t('changePassword.error'));
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

          <form onSubmit={handlePasswordUpdate} className="space-y-5">
            <Input
              label={t('changePassword.currentPassword')}
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              error={error && error.includes('current') ? error : undefined}
            />

            <Input
              label={t('changePassword.newPassword')}
              name="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              error={error && error.includes('new') ? error : undefined}
            />

            <Input
              label={t('changePassword.confirmPassword')}
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={error && (error.includes('confirm') || error.includes('match')) ? error : undefined}
            />

            {error && !error.includes('current') && !error.includes('new') && !error.includes('confirm') && (
              <div className="px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 bg-green-50 border-2 border-green-500 text-green-700 text-sm rounded-lg">
                {success}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isUpdating}
                className="min-w-[160px]"
              >
                {isUpdating ? t('changePassword.updating') : t('changePassword.update')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
