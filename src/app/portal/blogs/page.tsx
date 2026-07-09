import { Suspense } from 'react';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { BlogCard } from '@/components/portal/sections/blogs/BlogCard';
import { BlogFilters } from '@/components/portal/sections/blogs/BlogFilters';
import { BlogPaginationNav } from '@/components/portal/sections/blogs/BlogPaginationNav';
import type { Blog, PaginatedResponse } from '@aizen/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog & Tin tức AI',
  description: 'Cập nhật kiến thức, xu hướng và tin tức AI mới nhất từ AIZEN.',
};

interface SearchParams {
  category?: string;
  page?: string;
}

async function fetchBlogs(params: SearchParams): Promise<PaginatedResponse<Blog>> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.page) query.set('page', params.page);
  query.set('limit', '6');

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/blogs?${query.toString()}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) throw new Error('Fetch failed');
    const json = (await res.json()) as { data: PaginatedResponse<Blog> };
    return json.data ?? { items: [], pagination: { total: 0, page: 1, limit: 6, totalPages: 0 } };
  } catch {
    return { items: [], pagination: { total: 0, page: 1, limit: 6, totalPages: 0 } };
  }
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
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC]">
        {/* Hero banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-400 py-14">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 left-1/3 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-white/90 rounded-full px-6 py-2.5 shadow-sm">
              <span className="text-indigo-600 font-bold text-lg">Explore AI world</span>
              <span className="text-xl">🤖</span>
            </div>

            <p className="text-white/90 mt-4 max-w-xl text-sm md:text-base">
              Cập nhật kiến thức, xu hướng công nghệ và tin tức AI mới nhất — được tuyển chọn bởi
              đội ngũ AIZEN.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Blog & Tin tức</h1>
              <p className="text-gray-500 mt-1">{pagination.total} bài viết</p>
            </div>

            <Suspense fallback={<div className="flex gap-2"><div className="w-20 h-9 bg-gray-100 rounded-full animate-pulse" /></div>}>
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
            <div className="mt-16 text-center">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-gray-500">Chưa có bài viết nào.</p>
            </div>
          )}

          <div className="mt-12">
            <Suspense fallback={null}>
              <BlogPaginationNav currentPage={currentPage} totalPages={pagination.totalPages} />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
