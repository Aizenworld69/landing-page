import Link from 'next/link';
import { Badge } from '@/components/portal/ui/Badge';
import { Button } from '@/components/portal/ui/Button';
import { formatDateLong, getDaysUntil } from '@/lib/portal/utils/format';
import type { Enrollment } from '@aizen/types';

interface UpcomingCourseCardProps {
  enrollment: Enrollment;
}

export function UpcomingCourseCard({ enrollment }: UpcomingCourseCardProps) {
  const course = enrollment.courses;
  if (!course) return null;

  const daysUntil = course.start_date ? getDaysUntil(course.start_date) : null;
  const isStarted = daysUntil !== null && daysUntil <= 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
        <span className="text-3xl">📘</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
              {course.category}
            </span>
            <h3 className="font-bold text-gray-900 mt-0.5 leading-snug">{course.title}</h3>
          </div>
          <Badge variant="upcoming">Sắp diễn ra</Badge>
        </div>

        {course.start_date && (
          <p className="text-sm text-gray-500 mt-2">
            📅 {formatDateLong(course.start_date)}
          </p>
        )}

        {daysUntil !== null && daysUntil > 0 && (
          <p className="text-sm text-amber-500 font-medium mt-1">
            ⏱ Bắt đầu sau {daysUntil} ngày
          </p>
        )}

        <div className="mt-4">
          <Link href={`/courses/${course.slug}`}>
            <Button
              size="sm"
              variant={isStarted ? 'primary' : 'outline'}
              disabled={!isStarted}
            >
              {isStarted ? 'Vào học ngay' : `Mở sau ${daysUntil} ngày`}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
