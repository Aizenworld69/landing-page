'use client';

import { RegistrationReportData } from './reportActions';

export default function RegistrationReport({
  data,
}: {
  data: RegistrationReportData;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng đăng ký */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-[20px]">
                assignment
              </span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {data.total_registrations}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-1">Tổng đăng ký</p>
        </div>

        {/* Card 2: Đã thanh toán */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-[20px]">
                check_circle
              </span>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {data.conversion_rate}%
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {data.paid_count}
            <span className="text-lg text-slate-400 font-medium ml-1">
              / {data.total_registrations}
            </span>
          </p>
          <p className="text-sm text-slate-500 font-medium mt-1">Đã thanh toán</p>
        </div>

        {/* Card 3: Chưa thanh toán */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">
                pending_actions
              </span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {data.unpaid_count}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-1">Chưa thanh toán</p>
        </div>

        {/* Card 4: Tổng tiền nợ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-[20px]">
                attach_money
              </span>
            </div>
          </div>
          <p className="text-2xl font-black text-red-600">
            {formatCurrency(data.total_unpaid_amount)}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-1">Tổng tiền nợ</p>
        </div>
      </div>

      {/* Doanh thu vs Tiền nợ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Doanh thu đã nhận</h3>
          <p className="text-4xl font-black text-green-600">
            {formatCurrency(data.total_paid_amount)}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Từ {data.paid_count} đơn thanh toán
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Doanh thu chưa nhận</h3>
          <p className="text-4xl font-black text-amber-600">
            {formatCurrency(data.total_unpaid_amount)}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Từ {data.unpaid_count} đơn chờ xử lý
          </p>
        </div>
      </div>

      {/* Xu hướng theo tháng */}
      {data.monthly_trends.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Xu hướng 12 tháng</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Tháng
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">
                    Đơn đăng ký
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">
                    Đã CK
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">
                    Chưa CK
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.monthly_trends.map((trend) => (
                  <tr key={trend.month} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {trend.month}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {trend.registrations}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">
                      {trend.paid}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-600 font-medium">
                      {trend.unpaid}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-medium">
                      {formatCurrency(trend.revenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
