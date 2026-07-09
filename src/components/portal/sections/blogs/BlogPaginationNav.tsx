'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/portal/ui/Pagination';

interface BlogPaginationNavProps {
  currentPage: number;
  totalPages: number;
}

export function BlogPaginationNav({ currentPage, totalPages }: BlogPaginationNavProps) {
  const router = useRouter();
  const params = useSearchParams();

  function handlePageChange(page: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(page));
    router.push(`/blogs?${next.toString()}`);
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
