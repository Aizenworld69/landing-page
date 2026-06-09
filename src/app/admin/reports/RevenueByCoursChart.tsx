'use client';

import { RevenueByCoursData } from './reportActions';

export default function RevenueByCoursChart({
  data,
}: {
  data: RevenueByCoursData[];
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);

  // Tìm max revenue để scale chart
  const maxRevenue = Math.max(...data.map((d) => d.total_revenue), 1);
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Doanh thu theo khóa học</h2>

      {data.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          Chưa có dữ liệu doanh thu
        </div>
      ) : (
        <div className="space-y-6">
          {/* Simple Bar Chart */}
          <div className="space-y-4">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: `${chartHeight}px`,
                gap: '1rem',
                paddingBottom: '1rem',
              }}
            >
              {data.map((course) => {
                const barHeight = (course.total_revenue / maxRevenue) * chartHeight;
                return (
                  <div
                    key={course.course}
                    className="flex flex-col items-center flex-1"
                    title={`${course.course}: ${formatCurrency(course.total_revenue)}`}
                  >
                    <div
                      className="bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-lg w-full transition-all hover:from-teal-600 hover:to-teal-500"
                      style={{
                        height: `${Math.max(barHeight, 5)}px`,
                        minWidth: '40px',
                      }}
                    />
                    <div className="text-xs text-slate-600 font-medium mt-2 text-center truncate w-full px-1">
                      {course.course}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Detail */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    Khóa học
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
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">
                    % CK
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((course) => (
                  <tr key={course.course} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {course.course}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {course.total_registrations}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">
                      {course.paid_count}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-600 font-medium">
                      {course.unpaid_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-6 bg-slate-100 text-slate-600 rounded font-bold text-xs">
                        {course.payment_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold">
                      {formatCurrency(course.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrency(data.reduce((sum, d) => sum + d.total_revenue, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Tỉ lệ chuyển đổi
              </p>
              <p className="text-2xl font-black text-slate-900">
                {data.length > 0
                  ? Math.round(
                      (data.reduce((sum, d) => sum + d.paid_count, 0) /
                        data.reduce((sum, d) => sum + d.total_registrations, 0)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
