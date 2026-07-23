import { Suspense } from 'react';
import { Breadcrumb } from '@/components/portal/common/Breadcrumb';
import { CourseCard } from '@/components/portal/sections/courses/CourseCard';
import { CourseFilters } from '@/components/portal/sections/courses/CourseFilters';
import { Pagination } from '@/components/portal/ui/Pagination';
import type { Course, PaginatedResponse } from '@aizen/types';
import type { Metadata } from 'next';
import { fetchCoursesServer } from '@/lib/portal/server-data';

export const metadata: Metadata = {
  title: 'Thư viện khóa học',
  description: 'Xem tất cả khóa học AI thực chiến của AIZEN Education',
};

interface SearchParams {
  status?: string;
  category?: string;
  year?: string;
  page?: string;
  q?: string;
}

async function fetchCourses(params: SearchParams): Promise<PaginatedResponse<Course>> {
  return fetchCoursesServer({
    status: params.status,
    category: params.category,
    year: params.year,
    page: params.page ? Number(params.page) : 1,
    limit: 9,
    search: params.q,
  });
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { items, pagination } = await fetchCourses(params);
  const currentPage = Number(params.page ?? 1);

  const nearestUpcomingDate = items
    .filter((c) => c.status === 'upcoming' && c.start_date)
    .map((c) => c.start_date as string)
    .sort()[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/portal' }, { label: 'Khóa học' }]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-md">Thư viện khóa học</h1>
        <p className="text-amber-400 font-extrabold mt-1 text-sm">{pagination.total} khóa học có sẵn</p>
      </div>

      <Suspense fallback={<div className="flex flex-col sm:flex-row gap-3 animate-pulse">
        <div className="flex-1 h-10 bg-slate-800/50 rounded-lg" />
        <div className="w-44 h-10 bg-slate-800/50 rounded-lg" />
        <div className="w-36 h-10 bg-slate-800/50 rounded-lg" />
      </div>}>
        <CourseFilters />
      </Suspense>

      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isNearestUpcoming={nearestUpcomingDate !== null && course.start_date === nearestUpcomingDate}
            />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center bg-slate-900/80 p-12 rounded-3xl border border-slate-700/60 backdrop-blur-md">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-slate-200 font-medium">Không tìm thấy khóa học phù hợp.</p>
        </div>
      )}

      <div className="mt-12">
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={() => {}}
        />
      </div>
    </div>
  );
}