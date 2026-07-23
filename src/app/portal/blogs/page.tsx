import { Suspense } from 'react';
import { BlogCard } from '@/components/portal/sections/blogs/BlogCard';
import { BlogFilters } from '@/components/portal/sections/blogs/BlogFilters';
import { BlogPaginationNav } from '@/components/portal/sections/blogs/BlogPaginationNav';
import type { Blog, PaginatedResponse } from '@aizen/types';
import type { Metadata } from 'next';
import { fetchBlogsServer } from '@/lib/portal/server-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog & Tin tức AI',
  description: 'Cập nhật kiến thức, xu hướng và tin tức AI mới nhất từ AIZEN.',
};

interface SearchParams {
  category?: string;
  page?: string;
}

async function fetchBlogs(params: SearchParams): Promise<PaginatedResponse<Blog>> {
  return fetchBlogsServer({
    category: params.category,
    page: params.page ? Number(params.page) : 1,
    limit: 6,
  });
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { items, pagination } = await fetchBlogs(params);
  const currentPage = Number(params.page ?? 1);

  return (
    <div className="py-6">
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-3xl py-12 max-w-6xl mx-auto shadow-2xl">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 rounded-full px-6 py-2 shadow-sm">
            <span className="text-amber-300 font-extrabold text-base">Khám phá thế giới AI</span>
            <span className="text-xl">🤖</span>
          </div>

          <p className="text-slate-100 font-medium mt-4 max-w-xl text-sm md:text-base">
            Cập nhật kiến thức, xu hướng công nghệ và tin tức AI mới nhất — được tuyển chọn bởi
            đội ngũ AIZEN.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-md">Blog & Tin tức</h1>
            <p className="text-amber-400 font-bold mt-1 text-sm">{pagination.total} bài viết mới nhất</p>
          </div>

          <Suspense fallback={<div className="flex gap-2"><div className="w-20 h-9 bg-slate-800 rounded-full animate-pulse" /></div>}>
            <BlogFilters />
          </Suspense>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center bg-slate-900/80 p-12 rounded-3xl border border-slate-700/60 backdrop-blur-md">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-slate-200 font-medium">Chưa có bài viết nào.</p>
          </div>
        )}

        <div className="mt-12">
          <Suspense fallback={null}>
            <BlogPaginationNav currentPage={currentPage} totalPages={pagination.totalPages} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
