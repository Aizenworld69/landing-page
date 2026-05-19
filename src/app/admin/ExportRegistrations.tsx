'use client';

import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';

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

interface ExportRegistrationsProps {
  data: Registration[];
}

export default function ExportRegistrations({ data }: ExportRegistrationsProps) {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đăng ký');

    // Cấu hình các cột (Define columns)
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Họ và Tên', key: 'fullname', width: 25 },
      { header: 'Số Điện Thoại', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Nguồn Thông Tin', key: 'referral', width: 20 },
      { header: 'Vai Trò', key: 'role', width: 15 },
      { header: 'Tên Công Ty', key: 'company', width: 25 },
      { header: 'Ngày Đăng Ký', key: 'created_at', width: 25 },
    ];

    // Định dạng dòng tiêu đề (Style the header row)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo-600
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 35;

    // Cố định dòng đầu tiên (Freeze the first row)
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Thêm dữ liệu (Add data)
    data.forEach((reg) => {
      const rowData = {
        ...reg,
        created_at: new Date(reg.created_at).toLocaleString('vi-VN'),
      };
      const row = worksheet.addRow(rowData);
      
      // Định dạng cơ bản cho mỗi dòng
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 30;
    });

    // Tự động điều chỉnh độ rộng cột dựa trên nội dung (Auto-adjust column widths)
    worksheet.columns.forEach((column) => {
      if (!column || !column.values) return;
      
      let maxLength = 0;
      column.values.forEach((v) => {
        const valueLength = v ? v.toString().length : 0;
        if (valueLength > maxLength) {
          maxLength = valueLength;
        }
      });
      column.width = Math.max(column.width || 0, maxLength + 8);
    });

    // Thêm viền cho tất cả các ô (Add borders to all cells)
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, // Slate-300
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });
    });

    // Xuất file (Generate buffer and save)
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Danh_sach_dang_ky_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  };

  return (
    <button
      onClick={exportToExcel}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
    >
      <Download size={18} />
      <span>Xuất Excel</span>
    </button>
  );
}
