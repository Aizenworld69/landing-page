import { Suspense } from 'react';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { Breadcrumb } from '@/components/portal/common/Breadcrumb';
import { CourseCard } from '@/components/portal/sections/courses/CourseCard';
import { CourseFilters } from '@/components/portal/sections/courses/CourseFilters';
import { Pagination } from '@/components/portal/ui/Pagination';
import type { Course, PaginatedResponse } from '@aizen/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thu vien khoa hoc',
  description: 'Xem tat ca khoa hoc AI thuc chien cua AIZEN Education',
};

interface SearchParams {
  status?: string;
  category?: string;
  year?: string;
  page?: string;
  q?: string;
}

async function fetchCourses(params: SearchParams): Promise<PaginatedResponse<Course>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.year) query.set('year', params.year);
  if (params.page) query.set('page', params.page);
  query.set('limit', '9');

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/courses?${query.toString()}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error('Fetch failed');
    const json = (await res.json()) as { data: PaginatedResponse<Course> };
    return json.data ?? [];
  } catch {
    return { items: [], pagination: { total: 0, page: 1, limit: 9, totalPages: 0 } };
  }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { items, pagination } = await fetchCourses(params);
  const currentPage = Number(params.page ?? 1);

  // Chi khoa hoc "sap dien ra" co ngay khai giang GAN NHAT moi duoc noi bat/chuyen dong
  const nearestUpcomingDate = items
    .filter((c) => c.status === 'upcoming' && c.start_date)
    .map((c) => c.start_date as string)
    .sort()[0] ?? null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[{ label: 'Trang chu', href: '/' }, { label: 'Khoa hoc da dien ra' }]}
          />

          <div className="mt-6 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Thu vien khoa hoc</h1>
            <p className="text-gray-500 mt-1">{pagination.total} khoa hoc</p>
          </div>

          <Suspense fallback={<div className="flex flex-col sm:flex-row gap-3 animate-pulse">
            <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
            <div className="w-44 h-10 bg-gray-100 rounded-lg" />
            <div className="w-36 h-10 bg-gray-100 rounded-lg" />
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
            <div className="mt-16 text-center">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-gray-500">Khong tim thay khoa hoc phu hop.</p>
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
      </main>
      <Footer />
    </>
  );
}