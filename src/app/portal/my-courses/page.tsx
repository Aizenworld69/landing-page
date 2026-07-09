import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { UpcomingCourseCard } from '@/components/portal/sections/my-courses/UpcomingCourseCard';
import { CompletedCourseCard } from '@/components/portal/sections/my-courses/CompletedCourseCard';
import type { Enrollment } from '@aizen/types';

export const metadata: Metadata = {
  title: 'Khóa học của tôi',
};

async function getMyEnrollments(token: string): Promise<Enrollment[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-courses`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) return [];
    if (!res.ok) throw new Error('fetch failed');
    const json = (await res.json()) as { data: Enrollment[] };
    return json.data;
  } catch {
    return [];
  }
}

// NOTE: Trang này cần middleware.ts để protect. Dùng cookie-based session với Supabase.
// Trong demo, redirect nếu không có cookie auth (middleware xử lý thực tế).
export default async function MyCoursesPage() {
  // Auth check được xử lý bởi middleware.ts
  // Đây là Server Component — trong thực tế đọc token từ cookies()
  const enrollments: Enrollment[] = []; // sẽ được inject qua server-side session

  const upcoming = enrollments.filter((e) => e.status === 'upcoming');
  const completed = enrollments.filter((e) => e.status === 'completed');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Khóa học của tôi
          </h1>
          <p className="text-gray-500 mb-10">Quản lý và theo dõi tiến độ học tập của bạn.</p>

          {/* Upcoming */}
          <section className="mb-12">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-5 bg-primary-500 rounded-full inline-block" />
              Khóa học sắp diễn ra
            </h2>
            {upcoming.length > 0 ? (
              <div className="flex flex-col gap-4">
                {upcoming.map((e) => (
                  <UpcomingCourseCard key={e.id} enrollment={e} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl text-gray-400">
                <p className="text-3xl mb-3">📅</p>
                <p>Bạn chưa đăng ký khóa học nào sắp diễn ra.</p>
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-5 bg-green-500 rounded-full inline-block" />
              Khóa học đã tham gia
            </h2>
            {completed.length > 0 ? (
              <div className="flex flex-col gap-4">
                {completed.map((e) => (
                  <CompletedCourseCard key={e.id} enrollment={e} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl text-gray-400">
                <p className="text-3xl mb-3">🏆</p>
                <p>Bạn chưa hoàn thành khóa học nào.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
