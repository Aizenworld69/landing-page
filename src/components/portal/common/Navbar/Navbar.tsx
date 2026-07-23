'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/portal/utils/cn';

const NAV_LINKS = [
  { href: '/portal', label: 'Trang chủ' },
  { href: '/courses', label: 'Khóa học' },
  { href: '/instructors', label: 'Giảng viên' },
  { href: '/learning-path', label: 'Lộ trình' },
  { href: '/resources', label: 'Tài nguyên' },
  { href: '/blogs', label: 'Blogs' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/portal' || href === '/') {
      return pathname === '/portal' || pathname === '/';
    }
    return pathname.startsWith(href) || pathname.startsWith(`/portal${href}`);
  };

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-300">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/15 shadow-2xl shadow-slate-950/50 rounded-2xl flex items-center justify-between px-5 h-16 relative">
        {/* Logo */}
        <Link href="/portal" className="flex items-center gap-2 group transition-transform active:scale-95">
          <Image
            src="/logo.png"
            alt="AIZEN Education"
            width={120}
            height={40}
            className="object-contain h-9 w-auto filter drop-shadow-md"
            priority
          />
        </Link>

        {/* Desktop Nav - Centered Floating Pill */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1.5 rounded-full border border-white/10 shadow-inner">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-xs font-extrabold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                    : 'text-slate-200 hover:text-white hover:bg-white/10',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 hover:border-sky-400 transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            <span>Tư vấn khóa học</span>
            <span className="text-sky-400 font-bold">→</span>
          </Link>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer - Aligned to Right Corner */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden absolute top-full right-4 sm:right-6 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl shadow-slate-950/90 z-50 origin-top-right ml-auto"
          >
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Danh mục Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors"
                aria-label="Đóng menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between',
                      active
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <span>{label}</span>
                    {active && <span className="text-sky-300 text-xs">●</span>}
                  </Link>
                );
              })}
              <div className="pt-2 mt-2 border-t border-white/10">
                <Link
                  href="/courses"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-extrabold text-center block transition-all shadow-md shadow-sky-500/25"
                >
                  Tư vấn khóa học →
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}