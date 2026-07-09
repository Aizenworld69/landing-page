'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/portal/ui/Input';
import { Button } from '@/components/portal/ui/Button';
import { apiClient } from '@/lib/portal/api/api-client';

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

const INITIAL: RegisterForm = { fullName: '', email: '', password: '', phone: '' };

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const next: Partial<RegisterForm> = {};
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email không hợp lệ';
    if (!form.password || form.password.length < 6)
      next.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    setApiError(null);
    try {
      await apiClient.post('/portal/auth/register', {
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      router.push('/portal/auth/login?registered=1');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Đăng ký thất bại, thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-primary-500">AIZEN</span>
            <span className="text-2xl font-light text-gray-400"> Education</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Bắt đầu hành trình AI của bạn</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            id="fullName"
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            error={errors.fullName}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="email@company.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
            required
          />
          <Input
            id="phone"
            label="Số điện thoại"
            type="tel"
            placeholder="0901234567 (không bắt buộc)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            id="password"
            label="Mật khẩu"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            required
          />
        </div>

        {apiError && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {apiError}
          </p>
        )}

        <Button
          size="lg"
          className="w-full mt-5"
          isLoading={isLoading}
          onClick={handleRegister}
        >
          Đăng ký
        </Button>

        <p className="text-sm text-center text-gray-500 mt-5">
          Đã có tài khoản?{' '}
          <Link href="/portal/auth/login" className="text-primary-500 hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
