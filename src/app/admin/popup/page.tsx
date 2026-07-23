import { checkAuth, getPopupConfigAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import SidebarNav from '../SidebarNav';
import PopupForm from './PopupForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cấu hình Popup Quảng cáo - Admin',
};

export default async function AdminPopupPage() {
  const authenticated = await checkAuth();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const config = await getPopupConfigAction();

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex font-body">
      <SidebarNav />
      <div className="flex-1 ml-[200px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-black text-slate-900">Quản lý Popup & Đếm Ngược</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cấu hình nội dung khuyến mãi, đếm ngược và nút hành động xuất hiện trên landing page.
            </p>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {config && <PopupForm initialConfig={config} />}
        </main>
      </div>
    </div>
  );
}
