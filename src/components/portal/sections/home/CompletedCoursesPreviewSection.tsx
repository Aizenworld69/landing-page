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
    <section className="py-16 md:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn direction="up" className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <p className="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2">Thư viện</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-md">
              Thư Viện Khóa Học Đã Hoàn Thành
            </h2>
            <p className="text-slate-100 text-sm max-w-lg font-medium">
              Xem lại chương trình giảng dạy, truy cập tài liệu và xem lại nội dung tóm tắt.
            </p>
          </div>
          <Link href="/portal/courses?status=completed">
            <Button size="sm" className="self-start md:self-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 rounded-full px-6 py-2.5 font-bold text-sm whitespace-nowrap hover:scale-105 transition-transform shadow-md cursor-pointer">
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
                <div className="card-hover relative rounded-3xl overflow-hidden bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 shadow-2xl min-h-[360px] flex flex-col justify-between group hover:border-amber-400/80 transition-all duration-300">
                  {mainCourse.thumbnail_url && (
                    <div className="absolute inset-0">
                      <Image
                        src={mainCourse.thumbnail_url}
                        alt={mainCourse.title}
                        fill
                        className="object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-700 opacity-60"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                    </div>
                  )}
                  {!mainCourse.thumbnail_url && (
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950" />
                  )}
                  <div className="relative p-6">
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/40 backdrop-blur-md">
                      Đã hoàn thành
                    </span>
                    {mainCourse.start_date && (
                      <span className="ml-3 text-xs text-slate-300 font-medium">
                        Tháng {new Date(mainCourse.start_date).getMonth() + 1},{' '}
                        {new Date(mainCourse.start_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  <div className="relative p-6">
                    <h3 className="text-2xl font-black text-white leading-snug mb-3 group-hover:text-amber-300 transition-colors">
                      {mainCourse.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {mainCourse.description}
                    </p>
                    <div className="flex gap-3">
                      <Link href={`/courses/${mainCourse.slug}`}>
                        <Button size="sm" variant="outline" className="bg-slate-900/80 border-slate-700/80 text-white hover:bg-amber-500 hover:border-amber-400 hover:text-white text-xs px-5 py-2 hover:scale-105 transition-all font-bold cursor-pointer">
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
                <div key={course.id} className="card-hover relative rounded-3xl overflow-hidden bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 shadow-2xl min-h-[160px] flex flex-col justify-between group hover:border-sky-400/80 transition-all duration-300">
                  {course.thumbnail_url && (
                    <div className="absolute inset-0">
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-50"
                        sizes="(max-width: 1024px) 100vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    </div>
                  )}
                  {!course.thumbnail_url && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-sky-950" />
                  )}
                  <div className="relative p-5 flex flex-col h-full justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/40 mb-3">
                        Đã hoàn thành
                      </span>
                      <h3 className="text-base font-black text-white leading-snug mb-2 group-hover:text-amber-300 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 font-medium">
                        {course.description}
                      </p>
                    </div>
                    <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-1.5 text-sky-300 text-xs font-bold hover:text-amber-300 transition-colors mt-3 group/link">
                      Xem tóm tắt
                      <span className="group-hover/link:translate-x-1.5 transition-transform inline-block">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </StaggerChildren>
          </div>
        ) : (
          <FadeIn>
            <div className="text-center py-16 text-slate-300 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-xl">
              <p className="text-4xl mb-3 animate-float inline-block">📚</p>
              <p className="font-medium">Chưa có khóa học nào hoàn thành.</p>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}