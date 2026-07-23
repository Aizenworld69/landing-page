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
      className="group bg-slate-900/80 border border-slate-700/60 rounded-3xl overflow-hidden flex flex-col backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-500/20 hover:border-sky-500/50"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-slate-950/80 overflow-hidden">
        {blog.thumbnail_url ? (
          <Image
            src={blog.thumbnail_url}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900">
            <span className="text-4xl">📰</span>
          </div>
        )}
        {blog.category && (
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {blog.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {blog.published_at ? formatDateBlog(blog.published_at) : ''}
          </span>
          <span>·</span>
          <span className="text-amber-300">bởi: {blog.author}</span>
        </div>

        <h3 className="font-bold text-base md:text-lg leading-snug text-white line-clamp-2 group-hover:text-sky-300 transition-colors">
          {blog.title}
        </h3>

        <p className="text-xs md:text-sm text-slate-300 line-clamp-2 flex-1 leading-relaxed">{blog.excerpt}</p>

        <span className="text-sky-400 text-xs md:text-sm font-semibold flex items-center gap-1.5 group-hover:text-amber-300 group-hover:gap-2.5 transition-all mt-2 pt-2 border-t border-slate-800/80">
          Xem thêm
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
