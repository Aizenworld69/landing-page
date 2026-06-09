'use client';

import { useState } from 'react';
import { getExportData, getRegistrationReportData } from './reportActions';
import * as ExcelJS from 'exceljs';

export default function ExportReportModal({ courses }: { courses: string[] }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert('Vui lòng chọn khoảng ngày');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch dữ liệu
      const [exportData, summaryData] = await Promise.all([
        getExportData(startDate, endDate, selectedCourse),
        getRegistrationReportData(startDate, endDate),
      ]);

      // Tạo workbook Excel
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Summary
      const summarySheet = workbook.addWorksheet('Tổng hợp');
      summarySheet.pageSetup = { paperSize: 9, orientation: 'portrait' };

      // Header
      summarySheet.mergeCells('A1:D1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = 'BÁO CÁO DOANH THU & ĐĂNG KÝ';
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(1).height = 25;

      // Thông tin báo cáo
      summarySheet.getCell('A3').value = 'Kỳ báo cáo:';
      summarySheet.getCell('A3').font = { bold: true };
      summarySheet.getCell('B3').value = `${startDate} đến ${endDate}`;
      if (selectedCourse) {
        summarySheet.getCell('A4').value = 'Khóa học:';
        summarySheet.getCell('A4').font = { bold: true };
        summarySheet.getCell('B4').value = selectedCourse;
      }

      // Stats
      let row = 6;
      const stats = [
        ['Tổng đơn đăng ký', summaryData.total_registrations],
        ['Đơn đã thanh toán', summaryData.paid_count],
        ['Đơn chưa thanh toán', summaryData.unpaid_count],
        ['Tỉ lệ thanh toán (%)', summaryData.conversion_rate],
        ['', ''],
        ['Tổng tiền nhận được', formatCurrency(summaryData.total_paid_amount)],
        ['Tổng tiền nợ', formatCurrency(summaryData.total_unpaid_amount)],
      ];

      stats.forEach(([label, value]) => {
        summarySheet.getCell(`A${row}`).value = label;
        summarySheet.getCell(`A${row}`).font = { bold: true };
        summarySheet.getCell(`B${row}`).value = value;
        if (typeof value === 'number') {
          summarySheet.getCell(`B${row}`).numFmt = '#,##0';
        }
        row++;
      });

      // Set column widths
      summarySheet.getColumn('A').width = 25;
      summarySheet.getColumn('B').width = 20;

      // Sheet 2: Detail
      const detailSheet = workbook.addWorksheet('Chi tiết');
      detailSheet.pageSetup = { paperSize: 9, orientation: 'landscape' };

      // Header
      const headers = [
        'STT',
        'Họ tên',
        'SĐT',
        'Email',
        'Công ty',
        'Khóa học',
        'Số tiền',
        'Trạng thái',
        'Ngày đăng ký',
      ];

      const headerRow = detailSheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1a7a5e' },
      };

      // Data rows
      exportData.forEach((item, idx) => {
        detailSheet.addRow([
          idx + 1,
          item.fullname,
          item.phone,
          item.email,
          item.company || '',
          item.course || '',
          formatCurrency(item.amount),
          item.payment_status === 'PAID' ? '✓ Đã CK' : '⏳ Chưa CK',
          new Date(item.created_at).toLocaleDateString('vi-VN'),
        ]);
      });

      // Auto resize columns
      detailSheet.columns.forEach((col, idx) => {
        col.width = [8, 20, 15, 25, 20, 20, 15, 12, 15][idx] || 15;
      });

      // Generate file
      const fileName = `BaoCao_${startDate}_den_${endDate}${selectedCourse ? '_' + selectedCourse : ''}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();

      // Download
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      alert('Xuất báo cáo thành công!');
      setOpen(false);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Lỗi khi xuất báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        Xuất Excel
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Xuất báo cáo</h2>

            <div className="space-y-4">
              {/* Ngày bắt đầu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Ngày kết thúc */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Khóa học */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Khóa học (tùy chọn)
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Tất cả khóa học --</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isLoading || !startDate || !endDate}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? 'Đang xuất...' : 'Xuất Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
