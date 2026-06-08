import { redirect } from 'next/navigation';
import { checkAuth } from '@/app/actions';
import db from '@/lib/db';
import { logoutAdmin } from '@/app/actions';
import DeleteButton from './DeleteButton';
import ExportRegistrations from './ExportRegistrations';
import PaymentToggle from './PaymentToggle';
import AddManualModal from './AddManualModal';
import EditModal from './EditModal';
import Link from 'next/link';
import SidebarNav from './SidebarNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard — Aizen World Admin',
};

type Registration = {
  id: number;
  fullname: string;
  phone: string;
  email: string;
  referral: string;
  role: string;
  company: string;
  payment_status: 'PAID' | 'UNPAID';
  payment_content: string | null;
  amount: number;
  created_at: string;
  members: number;
  package_type: string;
};

const ITEMS_PER_PAGE = 10;

// Sidebar navigation items
const NAV_ITEMS = [
  { icon: 'grid_view', label: 'Overview', href: '/admin' },
  { icon: 'group', label: 'Registrations', href: '/admin', active: true },
  { icon: 'payments', label: 'Financials', href: '/admin' },
  { icon: 'event', label: 'Workshop Info', href: '/admin' },
  { icon: 'settings', label: 'Settings', href: '/admin' },
];

export default async function AdminPage(props: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  // Kiểm tra auth bằng session token trong DB
  const authenticated = await checkAuth();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const searchParams = await props.searchParams;
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const searchQuery = searchParams.q?.toLowerCase().trim() ?? '';
  const statusFilter = searchParams.status ?? '';

  // Xây dựng query có điều kiện search + filter
  let whereClause = 'WHERE 1=1';
  const queryParams: (string | number)[] = [];

  if (searchQuery) {
    whereClause += ' AND (LOWER(fullname) LIKE ? OR phone LIKE ? OR LOWER(email) LIKE ?)';
    const like = `%${searchQuery}%`;
    queryParams.push(like, like, like);
  }

  if (statusFilter === 'PAID' || statusFilter === 'UNPAID') {
    whereClause += ' AND payment_status = ?';
    queryParams.push(statusFilter);
  }

  // Đếm tổng bản ghi phù hợp với filter
  const totalFiltered = db
    .prepare(`SELECT COUNT(*) as count FROM registrations ${whereClause}`)
    .get(...queryParams) as { count: number };

  const totalPages = Math.max(1, Math.ceil(totalFiltered.count / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * ITEMS_PER_PAGE;

  const registrations = db
    .prepare(
      `SELECT * FROM registrations ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...queryParams, ITEMS_PER_PAGE, offset) as Registration[];

  // Stats tổng quan (không phụ thuộc filter)
  const totalAll = db
    .prepare('SELECT COUNT(*) as count FROM registrations')
    .get() as { count: number };

  const todayCount = db
    .prepare(
      `SELECT COUNT(*) as count FROM registrations WHERE date(created_at) = date('now')`,
    )
    .get() as { count: number };

  const paidCount = db
    .prepare("SELECT COUNT(*) as count FROM registrations WHERE payment_status = 'PAID'")
    .get() as { count: number };

  const totalRevenue = db
    .prepare("SELECT SUM(amount) as total FROM registrations WHERE payment_status = 'PAID'")
    .get() as { total: number | null };

  const allRegistrations = db
    .prepare('SELECT * FROM registrations ORDER BY created_at DESC')
    .all() as Registration[];

  // Build query string helper
  const buildQuery = (params: Record<string, string>) => {
    const p = new URLSearchParams();
    if (searchQuery && !('q' in params)) p.set('q', searchQuery);
    if (statusFilter && !('status' in params)) p.set('status', statusFilter);
    Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v); });
    const qs = p.toString();
    return qs ? `?${qs}` : '';
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex font-body">
      {/* ── SIDEBAR ─────────────────────────────── */}
      <SidebarNav />

      {/* ── MAIN CONTENT ────────────────────────── */}
      <div className="flex-1 ml-[200px] flex flex-col min-h-screen">

        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-black text-slate-900">Quản lý Đăng ký &amp; Thanh toán</h1>
          <div className="flex items-center gap-3">
            <ExportRegistrations data={allRegistrations} />
            <button className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-[#1a7a5e] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">person</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">

          {/* ── STATS CARDS ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Đơn đăng ký */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">assignment</span>
                </div>
                {todayCount.count > 0 && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Today +{todayCount.count}
                  </span>
                )}
              </div>
              <p className="text-3xl font-black text-slate-900">{totalAll.count}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">Đơn đăng ký</p>
            </div>

            {/* Card 2: Đã thanh toán */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a7a5e]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#1a7a5e] text-[20px]">group</span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                  {totalAll.count > 0
                    ? Math.round((paidCount.count / totalAll.count) * 100)
                    : 0}% đã CK
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">
                {paidCount.count}
                <span className="text-lg text-slate-400 font-medium ml-1">/ {totalAll.count}</span>
              </p>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 mb-1">
                <div
                  className="bg-[#1a7a5e] h-1.5 rounded-full transition-all"
                  style={{
                    width: totalAll.count > 0
                      ? `${Math.round((paidCount.count / totalAll.count) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <p className="text-sm text-slate-500 font-medium">Đã thanh toán</p>
            </div>

            {/* Card 3: Doanh thu */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">payments</span>
                </div>
                <span className="text-xs font-bold text-blue-600">↑ confirmed</span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrency(totalRevenue.total ?? 0)}
              </p>
              <p className="text-sm text-slate-500 font-medium mt-1">Doanh thu xác nhận</p>
            </div>

            {/* Card 4: Chưa thanh toán */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">pending_actions</span>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">
                {totalAll.count - paidCount.count}
              </p>
              <p className="text-sm text-slate-500 font-medium mt-1">Chờ thanh toán</p>
            </div>
          </div>

          {/* ── TABLE CARD ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Toolbar: search + filter + add */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Search */}
              <form method="GET" className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Tìm tên, SĐT, email..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a7a5e]/20 focus:border-[#1a7a5e] text-slate-900"
                />
                {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
              </form>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status filter */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-bold">
                  {['', 'PAID', 'UNPAID'].map((s) => {
                    const label = s === '' ? 'Tất cả' : s;
                    const isActive = statusFilter === s;
                    return (
                      <Link
                        key={s}
                        href={buildQuery({ status: s, page: '1' })}
                        className={`px-3 py-2 transition-colors ${
                          isActive
                            ? 'bg-[#1a7a5e] text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>

                {/* Nút Thêm thủ công */}
                <AddManualModal />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12">STT</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">HỌ TÊN</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SĐT</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SỐ TIỀN</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">NỘI DUNG CK</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">NGÀY ĐK</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">TRẠNG THÁI CK</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl">folder_off</span>
                          <p className="text-sm font-medium">Không có kết quả nào phù hợp.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg, index) => (
                      <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* STT */}
                        <td className="px-5 py-4 text-sm font-bold text-slate-400">
                          {String(offset + index + 1).padStart(2, '0')}
                        </td>

                        {/* Họ tên */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{reg.fullname}</p>
                            {reg.package_type && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                reg.package_type === 'VIP'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                  : 'bg-teal-50 text-teal-700 border border-teal-100'
                              }`}>
                                {reg.package_type}{reg.members > 1 ? ` (x${reg.members})` : ''}
                              </span>
                            )}
                          </div>
                          {reg.company && (
                            <p className="text-xs text-slate-500 mt-0.5">{reg.company}</p>
                          )}
                          {reg.email && (
                            <p className="text-xs text-slate-400 mt-0.5">{reg.email}</p>
                          )}
                        </td>

                        {/* SĐT */}
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {reg.phone}
                        </td>

                        {/* Số tiền */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(reg.amount ?? 150000)}
                          </span>
                        </td>

                        {/* Nội dung CK */}
                        <td className="px-5 py-4">
                          {reg.payment_content ? (
                            <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {reg.payment_content}
                            </code>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Ngày ĐK */}
                        <td className="px-5 py-4 text-center">
                          <p className="text-sm font-bold text-slate-700">
                            {new Date(reg.created_at).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(reg.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>

                        {/* Trạng thái CK */}
                        <td className="px-5 py-4 text-center">
                          <PaymentToggle id={reg.id} currentStatus={reg.payment_status ?? 'UNPAID'} />
                        </td>

                        {/* Actions: Edit + Delete */}
                        <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                          <EditModal registration={reg} />
                          <DeleteButton id={reg.id} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-slate-500 font-medium">
                Hiển thị{' '}
                <span className="text-slate-900 font-bold">
                  {totalFiltered.count === 0 ? 0 : offset + 1}
                </span>{' '}
                –{' '}
                <span className="text-slate-900 font-bold">
                  {Math.min(offset + registrations.length, totalFiltered.count)}
                </span>{' '}
                trên{' '}
                <span className="text-slate-900 font-bold">{totalFiltered.count}</span> kết quả
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Link
                    href={buildQuery({ page: String(Math.max(1, safePage - 1)) })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${
                      safePage === 1
                        ? 'text-slate-300 pointer-events-none'
                        : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </Link>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
                    )
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
                          …
                        </span>
                      ) : (
                        <Link
                          key={p}
                          href={buildQuery({ page: String(p) })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                            p === safePage
                              ? 'bg-[#1a7a5e] text-white shadow-sm'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {p}
                        </Link>
                      ),
                    )}

                  <Link
                    href={buildQuery({ page: String(Math.min(totalPages, safePage + 1)) })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${
                      safePage === totalPages
                        ? 'text-slate-300 pointer-events-none'
                        : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
