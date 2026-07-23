import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { UpcomingCourseCard } from '@/components/portal/sections/my-courses/UpcomingCourseCard';
import { CompletedCourseCard } from '@/components/portal/sections/my-courses/CompletedCourseCard';
import type { Enrollment } from '@aizen/types';
import { supabaseAdmin } from '@/lib/portal/supabase-server';

export const metadata: Metadata = {
  title: 'Khóa học của tôi',
};

async function getMyEnrollments(): Promise<Enrollment[]> {
  try {
    const cookieStore = await cookies();
    const supabaseCookie = cookieStore.getAll().find(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'),
    );
    const accessToken = cookieStore.get('access_token')?.value;
    const token = accessToken || (supabaseCookie ? JSON.parse(supabaseCookie.value)?.access_token : null);

    if (!token) return [];

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return [];

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select('id, user_id, course_id, status, completed_at, created_at, courses(id, title, slug, thumbnail_url, status, start_date, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []) as unknown as Enrollment[];
  } catch {
    return [];
  }
}

export default async function MyCoursesPage() {
  const enrollments = await getMyEnrollments();

  const upcoming = enrollments.filter((e) => e.status === 'upcoming');
  const completed = enrollments.filter((e) => e.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-4xl font-black text-white mb-2 drop-shadow-md">
        Khóa học của tôi
      </h1>
      <p className="text-amber-400 font-extrabold mb-10 text-sm">Quản lý và theo dõi tiến độ học tập của bạn.</p>

      {/* Upcoming */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-5 bg-amber-400 rounded-full inline-block" />
          Khóa học sắp diễn ra
        </h2>
        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-4">
            {upcoming.map((e) => (
              <UpcomingCourseCard key={e.id} enrollment={e} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-900/80 border border-slate-700/60 backdrop-blur-md rounded-2xl text-slate-300">
            <p className="text-3xl mb-3">📅</p>
            <p className="font-medium">Bạn chưa đăng ký khóa học nào sắp diễn ra.</p>
          </div>
        )}
      </section>

      {/* Completed */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-5 bg-emerald-400 rounded-full inline-block" />
          Khóa học đã tham gia
        </h2>
        {completed.length > 0 ? (
          <div className="flex flex-col gap-4">
            {completed.map((e) => (
              <CompletedCourseCard key={e.id} enrollment={e} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-900/80 border border-slate-700/60 backdrop-blur-md rounded-2xl text-slate-300">
            <p className="text-3xl mb-3">🏆</p>
            <p className="font-medium">Bạn chưa hoàn thành khóa học nào.</p>
          </div>
        )}
      </section>
    </div>
  );
}
