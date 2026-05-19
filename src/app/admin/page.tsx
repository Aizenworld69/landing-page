import { cookies } from 'next/headers';
import db from '@/lib/db';
import LoginForm from './LoginForm';
import { logoutAdmin } from '../actions';
import DeleteButton from './DeleteButton';
import ExportRegistrations from './ExportRegistrations';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Registration = {
  id: number;
  fullname: string;
  phone: string;
  email: string;
  referral: string;
  role: string;
  company: string;
  created_at: string;
};

const ITEMS_PER_PAGE = 10;

export default async function AdminPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const currentPage = parseInt(searchParams.page || '1', 10);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const totalItems = db.prepare('SELECT COUNT(*) as count FROM registrations').get() as { count: number };
  const totalPages = Math.ceil(totalItems.count / ITEMS_PER_PAGE);

  const registrations = db.prepare(`
    SELECT * FROM registrations 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(ITEMS_PER_PAGE, offset) as Registration[];

  const allRegistrations = db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all() as Registration[];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900 font-body">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-6 md:p-10 bg-gradient-to-br from-white to-slate-50 border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tight text-slate-900">Quản lý Đăng ký</h1>
              <p className="text-slate-500 font-medium mt-1">Tổng cộng {totalItems.count} người đăng ký tham gia</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <ExportRegistrations data={allRegistrations} />
              <form action={logoutAdmin} className="ml-auto md:ml-0">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition shadow-sm border border-red-100">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-xs">Thông tin người tham gia</th>
                <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-xs">Liên hệ</th>
                <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-xs">Mục lục</th>
                <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-xs text-center">Thời gian</th>
                <th className="p-5 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl">folder_off</span>
                      <p className="font-medium">Chưa có dữ liệu người đăng ký nào được ghi nhận.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-slate-900 text-lg mb-1">{reg.fullname}</div>
                      {reg.company && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm mb-2 font-medium">
                          <span className="material-symbols-outlined text-[14px]">domain</span>
                          {reg.company}
                        </div>
                      )}
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                        ID: #{reg.id}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                        <span className="font-bold text-sm">{reg.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                        <span className="text-sm font-medium">{reg.email}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nguồn & Vai trò</div>
                        <div className="text-sm text-slate-700 font-medium">
                          {reg.referral} <span className="text-slate-300 mx-1">/</span> <span className="text-slate-900">{reg.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="text-sm font-bold text-slate-600">{new Date(reg.created_at).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[11px] text-slate-400 font-medium uppercase mt-0.5">
                        {new Date(reg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <DeleteButton id={reg.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 font-body">
            <div className="text-sm text-slate-500 font-medium">
              Hiện thị người thứ <span className="text-slate-900 font-bold">{offset + 1}</span> đến <span className="text-slate-900 font-bold">{Math.min(offset + registrations.length, totalItems.count)}</span> trên tổng số <span className="text-slate-900 font-bold">{totalItems.count}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Link
                href={`?page=${Math.max(1, currentPage - 1)}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  currentPage === 1 
                    ? 'text-slate-300 pointer-events-none' 
                    : 'text-slate-600 bg-white hover:bg-white hover:shadow-md border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </Link>
              
              <div className="flex gap-1 px-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={`?page=${p}`}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                      p === currentPage 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 border border-primary' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>

              <Link
                href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  currentPage === totalPages 
                    ? 'text-slate-300 pointer-events-none' 
                    : 'text-slate-600 bg-white hover:bg-white hover:shadow-md border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
