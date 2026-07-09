import Link from 'next/link';
import { Button } from '@/components/portal/ui/Button';
import { FadeIn, StaggerChildren } from '@/components/portal/ui/AnimationWrapper';
import { getDaysUntil } from '@/lib/portal/utils/format';
import type { Course } from '@aizen/types';

interface UpcomingCoursesSectionProps {
  courses: Course[];
}

function formatDateShort(dateString: string | Date): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day < 10 ? '0' + day : day} Tháng ${month}`;
}

export function UpcomingCoursesSection({ courses }: UpcomingCoursesSectionProps) {
  return (
    <section className="bg-white py-20 md:py-28 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn direction="up" className="mb-10">
          <p className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-2">Sắp khai giảng</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
            Khóa Học Sắp Khai Giảng
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
            Đảm bảo chỗ của bạn trong các học phần chuyên sâu do chuyên gia hướng dẫn sắp tới của chúng tôi.
          </p>
        </FadeIn>

        {/* Cards */}
        {courses.length > 0 ? (
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" stagger={120}>
            {courses.map((course) => {
              const daysUntil = course.start_date ? getDaysUntil(course.start_date) : 0;
              const dateText = course.start_date ? formatDateShort(course.start_date) : '';

              return (
                <div
                  key={course.id}
                  className="card-hover bg-white rounded-2xl p-6 flex flex-col justify-between border border-gray-200 shadow-sm min-h-[280px] group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="inline-block px-3 py-1 bg-sky-50 text-sky-500 text-xs font-semibold rounded-full border border-sky-100 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300">
                        Sắp diễn ra
                      </span>
                      {dateText && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {dateText}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-sky-500 transition-colors duration-300">
                      <Link href={`/courses/${course.slug}`}>
                        {course.title}
                      </Link>
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                      {course.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-5 mt-5 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Bắt đầu sau</p>
                      <p className="text-sky-500 font-bold text-lg leading-tight">{daysUntil} Ngày</p>
                    </div>
                    <Link href={`/courses/${course.slug}`}>
                      <Button size="sm" className="px-5 py-2 bg-sky-500 hover:bg-sky-600 font-semibold text-xs text-white border-0 rounded-lg hover:scale-105 transition-transform">
                        Đăng ký ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </StaggerChildren>
        ) : (
          <FadeIn>
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-4xl mb-4 animate-float inline-block">📅</p>
              <p className="text-gray-400">Chưa có khóa học sắp khai giảng. Hãy theo dõi để cập nhật sớm nhất!</p>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}