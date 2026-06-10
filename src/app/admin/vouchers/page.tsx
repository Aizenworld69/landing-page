import { checkAuth } from '@/app/actions';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import SidebarNav from '../SidebarNav';
import AddVoucherModal from './AddVoucherModal';
import EditVoucherModal from './EditVoucherModal';
import DeleteVoucherButton from './DeleteVoucherButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quản lý Voucher - Admin',
};

interface Voucher {
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  applicable_package: string;
  created_at: string;
}

export default async function VouchersPage() {
  const authenticated = await checkAuth();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const vouchers: Voucher[] = db
    .prepare('SELECT * FROM vouchers ORDER BY created_at DESC')
    .all() as Voucher[];

  const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex font-body">
      <SidebarNav />
      <div className="flex-1 ml-[200px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-black text-slate-900">Quản lý Mã Giảm Giá (Vouchers)</h1>
          <AddVoucherModal />
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Mã Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Mức Giảm</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 text-center">Lượt Sử Dụng</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Gói Áp Dụng</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ngày Hết Hạn</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 text-center">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Chưa có mã giảm giá nào. Hãy thêm voucher mới.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => {
                    const isExpired = voucher.expires_at < nowUtc;
                    const isFullyUsed = voucher.used_count >= voucher.max_uses;

                    let statusLabel = 'Hoạt động';
                    let statusClass = 'bg-green-50 text-green-700 border-green-200';

                    if (isFullyUsed) {
                      statusLabel = 'Hết lượt';
                      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (isExpired) {
                      statusLabel = 'Hết hạn';
                      statusClass = 'bg-red-50 text-red-700 border-red-200';
                    }

                    // Format date to local standard readable format
                    let displayExpiry = 'Không có hạn';
                    if (voucher.expires_at) {
                      const d = new Date(voucher.expires_at.replace(' ', 'T') + (voucher.expires_at.length === 16 ? ':00' : ''));
                      displayExpiry = d.toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }

                    return (
                      <tr key={voucher.code} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 font-mono">{voucher.code}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 bg-blue-50/30 text-blue-700 rounded px-2 py-0.5 inline-block my-3 ml-6 border border-blue-100">
                          {voucher.discount_percent}% Off
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 text-center">
                          {voucher.used_count} <span className="text-slate-400 font-normal">/</span> {voucher.max_uses}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{voucher.applicable_package}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{displayExpiry}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right flex justify-end gap-2 items-center">
                          <EditVoucherModal voucher={voucher} />
                          <DeleteVoucherButton code={voucher.code} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
