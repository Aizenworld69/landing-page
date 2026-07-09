'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/portal/utils/cn';

const CATEGORIES = [
  { label: 'Tất cả', value: '' },
  { label: 'Blog', value: 'blog' },
  { label: 'Tin tức', value: 'news' },
];

export function BlogFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = params.get('category') ?? '';

  function updateCategory(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set('category', value);
    else next.delete('category');
    next.delete('page');
    startTransition(() => router.push(`/blogs?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => updateCategory(cat.value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
            currentCategory === cat.value
              ? 'bg-sky-500 text-white border-sky-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-sky-400 hover:text-sky-500',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
