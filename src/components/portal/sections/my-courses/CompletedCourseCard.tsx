import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/portal/ui/Badge';
import { Button } from '@/components/portal/ui/Button';
import { formatDate } from '@/lib/portal/utils/format';
import type { Enrollment } from '@aizen/types';

interface CompletedCourseCardProps {
  enrollment: Enrollment;
}

export function CompletedCourseCard({ enrollment }: CompletedCourseCardProps) {
  const course = enrollment.courses;
  if (!course) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-40 h-36 sm:h-auto bg-gray-100 flex-shrink-0">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
            <span className="text-4xl">🎓</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-5 flex-1">
        <div>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
              {course.category}
            </span>
            <Badge variant="completed">Đã hoàn thành</Badge>
          </div>
          <h3 className="font-bold text-gray-900 leading-snug">{course.title}</h3>
          {enrollment.completed_at && (
            <p className="text-xs text-gray-400 mt-1.5">
              ✅ Hoàn thành: {formatDate(enrollment.completed_at)}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <Link href={`/courses/${course.slug}`}>
            <Button size="sm" variant="outline">Xem lại nội dung</Button>
          </Link>
          <Link href={`/my-courses/${enrollment.id}/certificate`}>
            <Button size="sm" variant="ghost">⬇ Tải chứng chỉ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
