'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/portal/ui/Input';
import { Button } from '@/components/portal/ui/Button';
import { apiClient } from '@/lib/portal/api/api-client';
import { useAuthStore } from '@/store/portal/auth.store';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<{
        data: {
          accessToken: string;
          user: {
            id: string;
            email: string;
            fullName?: string;
            full_name?: string;
            avatarUrl?: string;
            avatar_url?: string;
          };
        };
      }>('/portal/auth/login', form);
      const { accessToken, user } = data.data;
      useAuthStore.getState().setAuth({
        id: user.id,
        email: user.email,
        full_name: user.fullName || user.full_name || '',
        avatar_url: user.avatarUrl || user.avatar_url || null,
      }, accessToken);
      router.push('/portal/my-courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-primary-500">AIZEN</span>
            <span className="text-2xl font-light text-gray-400"> Education</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mt-1">Chào mừng trở lại!</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="email@company.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            id="password"
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="w-full mt-5"
          isLoading={isLoading}
          onClick={handleLogin}
        >
          Đăng nhập
        </Button>

        <p className="text-sm text-center text-gray-500 mt-5">
          Chưa có tài khoản?{' '}
          <Link href="/portal/auth/register" className="text-primary-500 hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
