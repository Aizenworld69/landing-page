'use client';

import { useTransition } from 'react';
import { deleteCourse } from '@/app/actions';

export default function DeleteCourseButton({ courseId, courseName }: { courseId: number; courseName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Bạn có chắc muốn xóa khóa học "${courseName}"?`)) {
      startTransition(async () => {
        const result = await deleteCourse(courseId);
        if (!result.success) {
          alert(result.error || 'Đã có lỗi xảy ra khi xóa.');
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
    >
      🗑️ Xóa
    </button>
  );
}
