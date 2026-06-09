'use client';

import { useState, useTransition } from 'react';
import { updateCourse } from '@/app/actions';

interface Course {
  id: number;
  name: string;
  month: string;
  implementation_date: string;
  location: string;
}

export default function EditCourseModal({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateCourse(course.id, formData);
      if (result.success) {
        setSuccess(result.message || 'Khóa học đã được cập nhật thành công.');
        setTimeout(() => {
          setOpen(false);
          setSuccess('');
        }, 1500);
      } else {
        setError(result.error || 'Đã có lỗi xảy ra.');
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
      >
        ✏️ Sửa
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Sửa Khóa Học</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tên Khóa Học</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={course.name}
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tháng (YYYY-MM)</label>
                <input
                  type="month"
                  name="month"
                  defaultValue={course.month}
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ngày Thực Hiện</label>
                <input
                  type="date"
                  name="implementation_date"
                  defaultValue={course.implementation_date}
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Địa Điểm</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={course.location}
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isPending ? 'Đang cập nhật...' : 'Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
