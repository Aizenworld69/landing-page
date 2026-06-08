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
  payment_status: string;
  payment_content: string | null;
  amount: number;
  created_at: string;
};

interface ExportRegistrationsProps {
  data: Registration[];
}

export default function ExportRegistrations({ data }: ExportRegistrationsProps) {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đăng ký');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Họ và Tên', key: 'fullname', width: 25 },
      { header: 'Số Điện Thoại', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Nguồn Thông Tin', key: 'referral', width: 25 },
      { header: 'Vai Trò', key: 'role', width: 18 },
      { header: 'Tên Công Ty', key: 'company', width: 25 },
      { header: 'Số Tiền (đ)', key: 'amount', width: 14 },
      { header: 'Nội Dung CK', key: 'payment_content', width: 16 },
      { header: 'Trạng Thái CK', key: 'payment_status', width: 14 },
      { header: 'Ngày Đăng Ký', key: 'created_at', width: 22 },
    ];

    // Định dạng header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a7a5e' }, // màu xanh admin
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 32;

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Thêm dữ liệu
    data.forEach((reg) => {
      const row = worksheet.addRow({
        ...reg,
        payment_content: reg.payment_content ?? '',
        amount: reg.amount ?? 150000,
        created_at: new Date(reg.created_at).toLocaleString('vi-VN'),
      });

      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 28;

      // Tô màu theo trạng thái
      const statusCell = row.getCell('payment_status');
      if (reg.payment_status === 'PAID') {
        statusCell.font = { bold: true, color: { argb: 'FF1a7a5e' } };
      } else {
        statusCell.font = { bold: true, color: { argb: 'FF94a3b8' } };
      }
    });

    // Tự động điều chỉnh độ rộng
    worksheet.columns.forEach((column) => {
      if (!column?.values) return;
      let maxLength = 0;
      column.values.forEach((v) => {
        const len = v ? v.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      column.width = Math.max(column.width ?? 0, maxLength + 4);
    });

    // Viền cho tất cả ô
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `DanhSach_DangKy_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <button
      onClick={exportToExcel}
      className="flex items-center gap-2 px-4 py-2 bg-[#1a7a5e] hover:bg-[#15654d] text-white rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-95"
    >
      <Download size={16} />
      <span>Xuất Excel</span>
    </button>
  );
}
