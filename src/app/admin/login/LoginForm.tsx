'use client';

import { useState, useTransition } from 'react';
import { loginAdmin } from '@/app/actions';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAdmin(formData);
      // loginAdmin sẽ redirect nếu thành công — chỉ đến đây nếu thất bại
      if (result && !result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-50 px-4 font-body">
      {/* Card */}
      <div className="w-full max-w-[400px]">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <span className="material-symbols-outlined text-white text-3xl">
              shield_person
            </span>
          </div>
          <h1 className="text-2xl font-black font-headline text-slate-900 tracking-tight">
            Aizen World
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Hệ thống quản lý nội bộ
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Đăng nhập</h2>
            <p className="text-sm text-slate-500 mt-1">Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5" id="admin-login-form">

              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="text-sm font-semibold text-slate-700 block"
                >
                  Tên tài khoản
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                    person
                  </span>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    required
                    disabled={isPending}
                    placeholder="Nhập tên đăng nhập..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="text-sm font-semibold text-slate-700 block"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400"
                  />
                  {/* Toggle hiển thị mật khẩu */}
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error message inline */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-[fadeIn_0.2s_ease]"
                >
                  <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dim text-white py-3.5 rounded-xl font-bold font-headline text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
              >
                {isPending ? (
                  <>
                    {/* Loading spinner */}
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    Đăng nhập
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 font-medium mt-8">
          © 2026 Aizen World. Hệ thống nội bộ.
        </p>
      </div>
    </div>
  );
}
