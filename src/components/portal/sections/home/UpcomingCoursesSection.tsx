import Link from 'next/link';
import Image from 'next/image';
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
    <section className="py-20 md:py-28 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn direction="up" className="mb-10">
          <p className="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2">Sắp khai giảng</p>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-md">
            Khóa Học Sắp Khai Giảng
          </h2>
          <p className="text-slate-100 text-sm leading-relaxed max-w-xl font-medium">
            Đảm bảo chỗ của bạn trong các học phần chuyên sâu do chuyên gia hướng dẫn sắp tới của chúng tôi.
          </p>
        </FadeIn>

        {/* Cards */}
        {courses.length > 0 ? (
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={120}>
            {courses.map((course) => {
              const daysUntil = course.start_date ? getDaysUntil(course.start_date) : 0;
              const dateText = course.start_date ? formatDateShort(course.start_date) : '';

              return (
                <div
                  key={course.id}
                  className="card-hover bg-slate-900/85 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col justify-between border border-slate-700/80 shadow-2xl group min-h-[380px] hover:border-amber-400/80 transition-all duration-300"
                >
                  {/* Thumbnail Image */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900">
                        <span className="text-4xl">🎓</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Badges on Thumbnail */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-400/40 backdrop-blur-md uppercase tracking-wider">
                        Sắp diễn ra
                      </span>
                    </div>

                    {dateText && (
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1.5 text-[11px] text-white bg-slate-950/70 border border-slate-700/60 backdrop-blur-md px-2.5 py-1 rounded-full font-bold">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {dateText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white leading-snug mb-2 group-hover:text-amber-300 transition-colors duration-300">
                        <Link href={`/courses/${course.slug}`}>
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 font-medium">
                        {course.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Bắt đầu sau</p>
                        <p className="text-amber-400 font-black text-lg leading-tight">{daysUntil} Ngày</p>
                      </div>
                      <Link href={`/courses/${course.slug}`}>
                        <Button size="sm" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-extrabold text-xs text-white border-0 rounded-xl hover:scale-105 transition-transform shadow-md cursor-pointer">
                          Đăng ký ngay
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </StaggerChildren>
        ) : (
          <FadeIn>
            <div className="text-center py-16 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/60">
              <p className="text-4xl mb-4 animate-float inline-block">📅</p>
              <p className="text-slate-300 font-medium">Chưa có khóa học sắp khai giảng. Hãy theo dõi để cập nhật sớm nhất!</p>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}