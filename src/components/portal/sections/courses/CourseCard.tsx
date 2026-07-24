import Link from 'next/link';
import Image from 'next/image';
import { formatDate, getDaysUntil, formatDateRange } from '@/lib/portal/utils/format';
import type { Course } from '@aizen/types';

interface CourseCardProps {
  course: Course;
  theme?: 'light' | 'dark';
  showActions?: boolean;
  /** Chi khoa hoc "sap dien ra" GAN NHAT (so voi toan bo danh sach) moi duoc noi bat + chuyen dong */
  isNearestUpcoming?: boolean;
}

export function CourseCard({ course, showActions = true, isNearestUpcoming = false }: CourseCardProps) {
  const daysUntil = course.start_date ? getDaysUntil(course.start_date) : null;
  const isUpcoming = course.status === 'upcoming';
  const isUrgent = isUpcoming && isNearestUpcoming;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden flex flex-col bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/80 hover:shadow-amber-500/10 group min-h-[380px] justify-between ${
        isUrgent ? 'ring-2 ring-amber-400/80 shadow-amber-500/20' : ''
      }`}
    >
      <div>
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900">
              <span className="text-4xl">🎓</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col p-5 gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-amber-400 font-extrabold text-[11px] uppercase tracking-widest">
                {course.category || 'CHƯƠNG TRÌNH AI'}
              </p>
              {isUrgent ? (
                <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider animate-pulse border border-amber-300/40">
                  • KHAI GIẢNG SAU {daysUntil} NGÀY
                </span>
              ) : course.status === 'upcoming' ? (
                <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-400/40 backdrop-blur-md font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  SẮP DIỄN RA
                </span>
              ) : (
                <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ĐÃ DIỄN RA
                </span>
              )}
            </div>
            <h3 className="font-black text-lg text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
              <Link href={`/courses/${course.slug}`}>
                {course.title}
              </Link>
            </h3>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 font-medium">
            {course.description}
          </p>

          {/* Date / Countdown */}
          {course.start_date && (
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-1">
              {course.status === 'upcoming' && daysUntil !== null && daysUntil > 0 ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  ⏱ Bắt đầu sau {daysUntil} ngày
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  📅 {formatDateRange(course.start_date, course.end_date) || formatDate(course.start_date)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      {showActions && (
        <div className="p-5 pt-0">
          <div className="flex gap-2.5 border-t border-slate-800/80 pt-4">
            {course.status === 'upcoming' ? (
              <Link href={`/courses/${course.slug}`} className="flex-1">
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Đăng ký ngay
                </button>
              </Link>
            ) : (
              <>
                <Link href={`/courses/${course.slug}`} className="flex-1">
                  <button
                    type="button"
                    className="w-full bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/40 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer hover:border-amber-400"
                  >
                    Xem tóm tắt
                  </button>
                </Link>
                <Link href={`/courses/${course.slug}#case`} className="flex-1">
                  <button
                    type="button"
                    className="w-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    Tình huống
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
