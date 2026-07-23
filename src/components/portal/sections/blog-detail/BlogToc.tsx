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
    <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-5 mb-8 backdrop-blur-xl shadow-lg shadow-sky-950/30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-sm font-bold text-sky-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Mục lục nội dung
        </span>
        <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
          {open ? 'Ẩn' : 'Hiện'}
        </span>
      </button>

      {open && (
        <ul className="mt-4 space-y-2 border-t border-slate-800 pt-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(item.level === 3 && 'pl-4')}
            >
              <a
                href={`#${item.id}`}
                className="text-sm text-slate-300 hover:text-amber-300 hover:translate-x-1 transition-all flex items-start gap-2 group"
              >
                <span className="text-sky-400 group-hover:text-amber-400 font-bold">•</span>
                <span>{item.text}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
