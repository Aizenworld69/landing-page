import { checkAuth } from '@/app/actions';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import SidebarNav from '../SidebarNav';
import AddCourseModal from './AddCourseModal';
import EditCourseModal from './EditCourseModal';
import DeleteCourseButton from './DeleteCourseButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quản lý Khóa Học - Admin',
};

interface Course {
  id: number;
  name: string;
  month: string;
  implementation_date: string;
  location: string;
  created_at: string;
}

export default async function CoursesPage() {
  const authenticated = await checkAuth();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const courses: Course[] = db
    .prepare('SELECT * FROM courses ORDER BY created_at DESC')
    .all() as Course[];

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex font-body">
      <SidebarNav />
      <div className="flex-1 ml-[200px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-black text-slate-900">Quản lý Khóa Học</h1>
          <AddCourseModal />
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tên Khóa Học</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tháng</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ngày Thực Hiện</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Địa Điểm</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Chưa có khóa học nào. Hãy thêm khóa học mới.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{course.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{course.month}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{course.implementation_date}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{course.location}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <EditCourseModal course={course} />
                        <DeleteCourseButton courseId={course.id} courseName={course.name} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
