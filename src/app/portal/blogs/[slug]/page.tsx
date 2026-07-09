import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { Breadcrumb } from '@/components/portal/common/Breadcrumb';
import { BlogToc } from '@/components/portal/sections/blog-detail/BlogToc';
import { BlogSidebar } from '@/components/portal/sections/blog-detail/BlogSidebar';
import { RelatedArticles } from '@/components/portal/sections/blog-detail/RelatedArticles';
import { formatDateBlog } from '@/lib/portal/utils/format';
import { extractToc } from '@/lib/portal/utils/toc';
import type { BlogWithRelated } from '@aizen/types';

async function getBlog(slug: string): Promise<BlogWithRelated | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/blogs/${slug}`,
      { next: { revalidate: 300 } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('fetch failed');
    const json = (await res.json()) as { data: BlogWithRelated };
    return json.data;
  } catch {
    return null;
  }
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
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Blog', href: '/portal/blogs' },
              { label: blog.title },
            ]}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
            {/* Main content */}
            <article>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">
                {blog.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                {blog.published_at && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateBlog(blog.published_at)}
                  </span>
                )}
                <span>·</span>
                <span>bởi: {blog.author}</span>
              </div>

              <BlogToc items={toc} />

              {/* eslint-disable-next-line react/no-danger */}
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.body_html }} />

              {blog.source_name && (
                <p className="mt-8 text-sm text-gray-400">
                  Nguồn:{' '}
                  {blog.source_url ? (
                    <a href={blog.source_url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                      {blog.source_name}
                    </a>
                  ) : (
                    blog.source_name
                  )}
                </p>
              )}

              <RelatedArticles items={blog.related} />
            </article>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <BlogSidebar />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
