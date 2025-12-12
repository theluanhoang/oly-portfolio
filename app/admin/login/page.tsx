'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/forms/Input';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/admin/projects/new';
      
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error;
        if (errorMessage.includes('Quá nhiều lần thử')) {
          setError(errorMessage);
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không đúng');
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
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
              Đăng Nhập Admin
            </h1>
            <p className="text-sm text-[#666]">
              Vui lòng đăng nhập để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Tên đăng nhập"
              name="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              error={error ? '' : undefined}
            />

            <Input
              label="Mật khẩu"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

