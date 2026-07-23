'use client';

import { useRef } from 'react';
import { BlogCard } from '@/components/portal/sections/blogs/BlogCard';
import type { Blog } from '@aizen/types';

interface RelatedArticlesProps {
  items: Blog[];
}

export function RelatedArticles({ items }: RelatedArticlesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  function scrollBy(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  return (
    <section className="mt-14 pt-10 border-t border-slate-800/80">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">Bài viết liên quan</h2>
      </div>

      <div className="relative">
        {items.length > 3 && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Bài trước"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-slate-800 text-sky-300 border border-slate-700 shadow-xl hover:bg-sky-500 hover:text-white transition-all"
          >
            ‹
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((blog) => (
            <div key={blog.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>

        {items.length > 3 && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Bài sau"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-slate-800 text-sky-300 border border-slate-700 shadow-xl hover:bg-sky-500 hover:text-white transition-all"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
