import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/portal/common/Breadcrumb';
import { BlogToc } from '@/components/portal/sections/blog-detail/BlogToc';
import { BlogSidebar } from '@/components/portal/sections/blog-detail/BlogSidebar';
import { RelatedArticles } from '@/components/portal/sections/blog-detail/RelatedArticles';
import { formatDateBlog } from '@/lib/portal/utils/format';
import { extractToc } from '@/lib/portal/utils/toc';
import type { BlogWithRelated } from '@aizen/types';
import { fetchBlogBySlugServer } from '@/lib/portal/server-data';

async function getBlog(slug: string): Promise<BlogWithRelated | null> {
  return fetchBlogBySlugServer(slug) as Promise<BlogWithRelated | null>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: 'Không tìm thấy bài viết' };
  return {
    title: blog.title,
    description: blog.excerpt,
    openGraph: { images: blog.thumbnail_url ? [blog.thumbnail_url] : [] },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();

  const toc = extractToc(blog.body_html);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/portal' },
          { label: 'Blog', href: '/portal/blogs' },
          { label: blog.title },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
        {/* Main content */}
        <article className="min-w-0 max-w-full bg-slate-900/75 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-slate-700/60 shadow-2xl shadow-sky-950/40 overflow-hidden">
          {/* Header metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {blog.category && (
              <span className="bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {blog.category}
              </span>
            )}
            {blog.published_at && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/80 px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDateBlog(blog.published_at)}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Tác giả: {blog.author}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-6 glow-white">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <div className="bg-slate-950/70 border-l-4 border-sky-400 p-4 sm:p-5 rounded-r-2xl text-slate-200 text-base sm:text-lg italic mb-8 backdrop-blur-md">
              {blog.excerpt}
            </div>
          )}

          <BlogToc items={toc} />

          {/* eslint-disable-next-line react/no-danger */}
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.body_html }} />

          {blog.source_name && (
            <div className="mt-10 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-sm text-slate-400">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Nguồn bài viết:</span>{' '}
              {blog.source_url ? (
                <a href={blog.source_url} target="_blank" rel="noopener noreferrer" className="text-sky-300 font-semibold hover:text-amber-300 underline underline-offset-4 transition-colors">
                  {blog.source_name}
                </a>
              ) : (
                <span className="text-slate-300 font-semibold">{blog.source_name}</span>
              )}
            </div>
          )}

          <RelatedArticles items={blog.related} />
        </article>

        {/* Sidebar Sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <BlogSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}
