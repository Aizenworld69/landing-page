import { checkAuth } from '@/app/actions';
import { redirect } from 'next/navigation';
import SidebarNav from '../SidebarNav';
import RevenueByCoursChart from './RevenueByCoursChart';
import RegistrationReport from './RegistrationReport';
import ExportReportModal from './ExportReportModal';
import {
  getRevenueByCoursData,
  getRegistrationReportData,
  getUniqueCourses,
} from './reportActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Báo cáo - Admin',
};

export default async function ReportsPage() {
  const authenticated = await checkAuth();
  if (!authenticated) {
    redirect('/admin/login');
  }

  // Fetch dữ liệu song song
  const [revenueData, registrationData, courses] = await Promise.all([
    getRevenueByCoursData(),
    getRegistrationReportData(),
    getUniqueCourses(),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex font-body">
      <SidebarNav />

      <div className="flex-1 ml-[200px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-black text-slate-900">Báo cáo & Thống kê</h1>
          <ExportReportModal courses={courses} />
        </header>

        <main className="flex-1 p-8 overflow-auto space-y-6">
          {/* Báo cáo chi tiết đăng ký vs thanh toán */}
          <RegistrationReport data={registrationData} />

          {/* Báo cáo doanh thu theo khóa học */}
          <RevenueByCoursChart data={revenueData} />
        </main>
      </div>
    </div>
  );
}
