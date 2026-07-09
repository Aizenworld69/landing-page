import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/portal/ui/Badge';
import { Button } from '@/components/portal/ui/Button';
import { formatDate, getDaysUntil } from '@/lib/portal/utils/format';
import type { Course } from '@aizen/types';

interface CourseCardProps {
  course: Course;
  theme?: 'light' | 'dark';
  showActions?: boolean;
  /** Chi khoa hoc "sap dien ra" GAN NHAT (so voi toan bo danh sach) moi duoc noi bat + chuyen dong */
  isNearestUpcoming?: boolean;
}

export function CourseCard({ course, theme = 'light', showActions = true, isNearestUpcoming = false }: CourseCardProps) {
  const daysUntil = course.start_date ? getDaysUntil(course.start_date) : null;
  const isDark = theme === 'dark';

  const isUpcoming = course.status === 'upcoming';
  const isUrgent = isUpcoming && isNearestUpcoming;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 ${
        isDark ? 'bg-navy-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
      } ${isUrgent ? 'ring-2 ring-orange-400 animate-pulse-glow-urgent' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gray-100">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
            <span className="text-4xl">🎓</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant={isUrgent ? 'urgent' : course.status} pulse={isUrgent}>
            {isUrgent
              ? `Khai giảng sau ${daysUntil} ngày`
              : course.status === 'upcoming'
              ? 'Sắp diễn ra'
              : 'Đã hoàn thành'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider mb-1.5 ${isDark ? 'text-primary-400' : 'text-primary-500'}`}>
            {course.category}
          </p>
          <h3 className={`font-semibold text-base leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {course.title}
          </h3>
        </div>

        <p className={`text-sm line-clamp-2 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {course.description}
        </p>

        {/* Date / Countdown */}
        {course.start_date && (
          <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {course.status === 'upcoming' && daysUntil !== null && daysUntil > 0 ? (
              <span className={isUrgent ? 'text-orange-600 font-semibold' : 'text-amber-500'}>
                ⏱ Bắt đầu sau {daysUntil} ngày
              </span>
            ) : (
              <span>📅 {formatDate(course.start_date)}</span>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-1">
            {course.status === 'upcoming' ? (
              <Link href={`/courses/${course.slug}`} className="flex-1">
                <Button size="sm" className="w-full">Đăng ký ngay</Button>
              </Link>
            ) : (
              <>
                <Link href={`/courses/${course.slug}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Xem tóm tắt</Button>
                </Link>
                <Link href={`/courses/${course.slug}#case`} className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full">Tình huống</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
