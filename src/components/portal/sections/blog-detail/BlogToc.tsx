'use client';

import { useState } from 'react';
import { cn } from '@/lib/portal/utils/cn';
import type { TocItem } from '@/lib/portal/utils/toc';

interface BlogTocProps {
  items: TocItem[];
}

export function BlogToc({ items }: BlogTocProps) {
  const [open, setOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-800"
      >
        <span>Các nội dung chính</span>
        <span className="text-sky-500 text-xs font-medium">{open ? 'Ẩn' : 'Hiện'}</span>
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(item.level === 3 && 'pl-4')}
            >
              <a
                href={`#${item.id}`}
                className="text-sm text-sky-600 hover:text-sky-700 hover:underline flex items-start gap-1.5"
              >
                <span aria-hidden="true">•</span>
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
