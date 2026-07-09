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
    <section className="mt-12 pt-10 border-t border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Bài viết liên quan</h2>

      <div className="relative">
        {items.length > 3 && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Bài trước"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
          >
            ‹
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
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
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
