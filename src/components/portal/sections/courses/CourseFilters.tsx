'use client';

import { useState, useTransition } from 'react';
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
    startTransition(() => router.push(`/courses?${next.toString()}`));
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="search"
        placeholder="Tìm khóa học..."
        defaultValue={currentSearch}
        onChange={(e) => updateParam('q', e.target.value)}
        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <select
        value={currentCategory}
        onChange={(e) => updateParam('category', e.target.value)}
        className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c === 'Tất cả' ? '' : c}>{c}</option>
        ))}
      </select>
      <select
        value={currentYear}
        onChange={(e) => updateParam('year', e.target.value)}
        className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {YEARS.map((y) => (
          <option key={y} value={y === 'Tất cả' ? '' : y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
