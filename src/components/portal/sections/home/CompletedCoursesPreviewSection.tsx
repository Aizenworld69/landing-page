import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/portal/ui/Button';
import { FadeIn, StaggerChildren } from '@/components/portal/ui/AnimationWrapper';
import type { Course } from '@aizen/types';

interface CompletedCoursesPreviewSectionProps {
  courses: Course[];
}

export function CompletedCoursesPreviewSection({ courses }: CompletedCoursesPreviewSectionProps) {
  const [mainCourse, ...sideCourses] = courses;

  return (
    <section className="bg-gray-50 py-16 md:py-24 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn direction="up" className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <p className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-2">Thư viện</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Thư Viện Khóa Học Đã Hoàn Thành
            </h2>
            <p className="text-gray-500 text-sm max-w-lg">
              Xem lại chương trình giảng dạy, truy cập tài liệu và xem lại nội dung tóm tắt.
            </p>
          </div>
          <Link href="/portal/courses?status=completed">
            <Button size="sm" className="self-start md:self-auto bg-sky-500 hover:bg-sky-600 text-white border-0 rounded-full px-6 py-2.5 font-semibold text-sm whitespace-nowrap hover:scale-105 transition-transform">
              Xem các khóa đã diễn ra →
            </Button>
          </Link>
        </FadeIn>

        {/* Grid layout */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Main featured card */}
            {mainCourse && (
              <FadeIn direction="left" delay={100}>
                <div className="card-hover relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm min-h-[360px] flex flex-col justify-between group">
                  {mainCourse.thumbnail_url && (
                    <div className="absolute inset-0">
                      <Image
                        src={mainCourse.thumbnail_url}
                        alt={mainCourse.title}
                        fill
                        className="object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    </div>
                  )}
                  {!mainCourse.thumbnail_url && (
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-blue-800 to-indigo-900" />
                  )}
                  <div className="relative p-6">
                    <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30">
                      Đã hoàn thành
                    </span>
                    {mainCourse.start_date && (
                      <span className="ml-3 text-xs text-gray-300">
                        Tháng {new Date(mainCourse.start_date).getMonth() + 1},{' '}
                        {new Date(mainCourse.start_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  <div className="relative p-6">
                    <h3 className="text-2xl font-bold text-white leading-snug mb-3">
                      {mainCourse.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6 line-clamp-3">
                      {mainCourse.description}
                    </p>
                    <div className="flex gap-3">
                      <Link href={`/courses/${mainCourse.slug}`}>
                        <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs px-4 py-2 hover:scale-105 transition-transform">
                          ⊙ Xem tóm tắt
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Side cards */}
            <StaggerChildren className="flex flex-col gap-5" stagger={150}>
              {sideCourses.slice(0, 2).map((course) => (
                <div key={course.id} className="card-hover relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm min-h-[160px] flex flex-col justify-between group">
                  {course.thumbnail_url && (
                    <div className="absolute inset-0">
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 1024px) 100vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    </div>
                  )}
                  {!course.thumbnail_url && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-blue-900" />
                  )}
                  <div className="relative p-4 flex flex-col h-full justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30 mb-3">
                        Đã hoàn thành
                      </span>
                      <h3 className="text-base font-bold text-white leading-snug mb-2 group-hover:text-sky-300 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-1 text-sky-300 text-xs font-medium hover:text-sky-200 transition-colors mt-3 group/link">
                      Xem tóm tắt
                      <span className="group-hover/link:translate-x-1 transition-transform inline-block">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </StaggerChildren>
          </div>
        ) : (
          <FadeIn>
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-3 animate-float inline-block">📚</p>
              <p>Chưa có khóa học nào hoàn thành.</p>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}