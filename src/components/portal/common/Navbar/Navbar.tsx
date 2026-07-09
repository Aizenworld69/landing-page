'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/portal/utils/cn';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/portal/courses', label: 'Khóa học' },
  { href: '/portal/instructors', label: 'Giảng viên' },
  { href: '/portal/learning-path', label: 'Lộ trình' },
  { href: '/portal/resources', label: 'Tài nguyên' },
  { href: '/portal/blogs', label: 'Blogs' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="AIZEN Education"
              width={120}
              height={40}
              className="object-contain h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav - centered absolutely */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-sm font-medium transition-colors relative pb-1',
                  isActive(href)
                    ? 'text-sky-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500 after:rounded-full'
                    : 'text-gray-700 hover:text-sky-500',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 ml-auto" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-gray-100 mt-1"
            >
              <nav className="flex flex-col gap-1 pt-3 pb-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(href)
                        ? 'bg-sky-50 text-sky-600'
                        : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}