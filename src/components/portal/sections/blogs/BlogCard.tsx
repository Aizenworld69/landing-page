import Link from 'next/link';
import Image from 'next/image';
import { formatDateBlog } from '@/lib/portal/utils/format';
import type { Blog } from '@aizen/types';

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-md hover:border-sky-200"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-50">
        {blog.thumbnail_url ? (
          <Image
            src={blog.thumbnail_url}
            alt={blog.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-100">
            <span className="text-4xl">📰</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {blog.published_at ? formatDateBlog(blog.published_at) : ''}
          </span>
          <span>·</span>
          <span>bởi: {blog.author}</span>
        </div>

        <h3 className="font-semibold text-base leading-snug text-gray-900 line-clamp-2 group-hover:text-sky-600 transition-colors">
          {blog.title}
        </h3>

        <p className="text-sm text-gray-500 line-clamp-2 flex-1">{blog.excerpt}</p>

        <span className="text-sky-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all mt-1">
          Xem thêm
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
