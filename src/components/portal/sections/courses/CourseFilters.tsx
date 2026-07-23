'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['Tất cả', 'AI & Machine Learning', 'Business AI', 'Data Science', 'Automation'];
const YEARS = ['Tất cả', '2024', '2025', '2026'];

export function CourseFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = params.get('category') ?? '';
  const currentYear = params.get('year') ?? '';
  const currentSearch = params.get('q') ?? '';

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== 'Tất cả') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    startTransition(() => router.push(`/portal/courses?${next.toString()}`));
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Tìm khóa học..."
          defaultValue={currentSearch}
          onChange={(e) => updateParam('q', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold rounded-xl focus:outline-none focus:border-amber-400 placeholder:text-slate-400 shadow-md transition-all"
        />
      </div>
      <select
        value={currentCategory}
        onChange={(e) => updateParam('category', e.target.value)}
        className="px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold rounded-xl focus:outline-none focus:border-amber-400 shadow-md transition-all cursor-pointer"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c === 'Tất cả' ? '' : c} className="bg-slate-900 text-white">
            Danh mục: {c}
          </option>
        ))}
      </select>
      <select
        value={currentYear}
        onChange={(e) => updateParam('year', e.target.value)}
        className="px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-bold rounded-xl focus:outline-none focus:border-amber-400 shadow-md transition-all cursor-pointer"
      >
        {YEARS.map((y) => (
          <option key={y} value={y === 'Tất cả' ? '' : y} className="bg-slate-900 text-white">
            Năm: {y}
          </option>
        ))}
      </select>
    </div>
  );
}
