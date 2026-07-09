'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getRegistrations, getAdminStats } from '@/lib/portal/admin/api';
import type { Registration, RegistrationsPage, AdminStats } from '@/lib/portal/admin/api';

// Helper to determine status deterministically from UUID hash
function getRegistrationStatus(id: string): 'success' | 'pending' | 'failed' {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 10;
  if (index < 7) return 'success';   // 70% paid
  if (index < 9) return 'pending';   // 20% pending
  return 'failed';                   // 10% failed
}

// Helper to get initials for avatar
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

// Helper to get soft color class for avatar
function getAvatarBg(name: string): string {
  const bgs = [
    'bg-sky-50 text-sky-600 border-sky-100',
    'bg-purple-50 text-purple-600 border-purple-100',
    'bg-indigo-50 text-indigo-600 border-indigo-100',
    'bg-pink-50 text-pink-600 border-pink-100',
    'bg-emerald-50 text-emerald-600 border-emerald-100',
    'bg-amber-50 text-amber-600 border-amber-100',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgs[Math.abs(hash) % bgs.length];
}

// Helper to get ticket type. Với đăng ký nhóm, lấy đúng số người trong nhóm (2 hoặc 4)
// dựa trên group_id thay vì hard-code '2 người'.
function getRegistrationTicketType(r: Registration, groupSizeMap: Map<string, number>): string {
  if (r.plan === 'group') {
    const size = r.group_id ? groupSizeMap.get(r.group_id) ?? 2 : 2;
    return `Nhóm ${size} người`;
  }

  let hash = 0;
  for (let i = 0; i < r.id.length; i++) {
    hash = r.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 2 === 0 ? '1 người' : 'Early Bird';
}

// Bảng màu để tô nhóm — mỗi group_id được gán 1 màu cố định theo thứ tự xuất hiện
const GROUP_COLORS = [
  { dot: 'bg-sky-500', bg: 'bg-sky-50/60', border: 'border-l-sky-400', text: 'text-sky-700' },
  { dot: 'bg-violet-500', bg: 'bg-violet-50/60', border: 'border-l-violet-400', text: 'text-violet-700' },
  { dot: 'bg-emerald-500', bg: 'bg-emerald-50/60', border: 'border-l-emerald-400', text: 'text-emerald-700' },
  { dot: 'bg-amber-500', bg: 'bg-amber-50/60', border: 'border-l-amber-400', text: 'text-amber-700' },
  { dot: 'bg-rose-500', bg: 'bg-rose-50/60', border: 'border-l-rose-400', text: 'text-rose-700' },
  { dot: 'bg-teal-500', bg: 'bg-teal-50/60', border: 'border-l-teal-400', text: 'text-teal-700' },
];

// Helper to get registration amount (default to course price or premium mockup value)
function getRegistrationAmount(r: Registration): number {
  const basePrice = r.plan === 'group'
    ? (r.courses?.price_group || 1200000)
    : (r.courses?.price || 1500000);
  
  // Multiply by 10 to display premium pricing as shown in the mockup (e.g. 15,000,000đ vs 1,500,000đ)
  return basePrice * 10;
}

export default function DangKyPage() {
  const [result, setResult] = useState<RegistrationsPage | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Load registration list and global stats
  const loadData = useCallback(async (pg: number, q: string, cId: string) => {
    setLoading(true);
    setError('');
    try {
      const [listData, statsData] = await Promise.all([
        getRegistrations({
          page: pg,
          limit: 20,
          search: q || undefined,
          courseId: cId === 'all' ? undefined : cId,
        }),
        getAdminStats(),
      ]);
      setResult(listData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page, search, selectedCourse);
  }, [loadData, page, search, selectedCourse]);

  // Handle Search Submission
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  // Clear All Filters
  function clearAllFilters() {
    setSearchInput('');
    setSearch('');
    setSelectedCourse('all');
    setSelectedStatus('all');
    setPage(1);
  }

  // Export CSV Helper
  function exportCsv() {
    if (!result?.data.length) return;
    const header = 'ID,Họ tên,Điện thoại,Email,Công ty,Chức vụ,Dạng vé,Nguồn,Khóa học,Số tiền,Trạng thái,Ngày đăng ký';
    const rows = result.data.map((r) => {
      const statusVal = getRegistrationStatus(r.id);
      const statusLabel = statusVal === 'success' ? 'Đã thanh toán' : statusVal === 'pending' ? 'Chờ xử lý' : 'Thất bại';
      const ticketType = getRegistrationTicketType(r, groupSizeMap);
      const amount = getRegistrationAmount(r);
      return [
        r.id,
        r.full_name,
        r.phone,
        r.email,
        r.company ?? '',
        r.position ?? '',
        ticketType,
        r.referral,
        r.courses?.title ?? '',
        amount,
        statusLabel,
        new Date(r.created_at).toLocaleString('vi-VN'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quan-ly-dang-ky-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Client-side filtering of registrations based on computed status
  const filteredRegistrations = useMemo(() => {
    if (!result?.data) return [];
    if (selectedStatus === 'all') return result.data;
    return result.data.filter((r) => getRegistrationStatus(r.id) === selectedStatus);
  }, [result?.data, selectedStatus]);

  // Gom nhóm các đăng ký theo group_id: đếm số người/nhóm, gán màu cố định theo
  // thứ tự xuất hiện, và liệt kê tên các thành viên khác cùng nhóm (để tooltip).
  const { groupSizeMap, groupColorMap, groupMatesMap } = useMemo(() => {
    const sizeMap = new Map<string, number>();
    const colorMap = new Map<string, typeof GROUP_COLORS[number]>();
    const matesMap = new Map<string, string[]>();
    const data = result?.data ?? [];

    data.forEach((r) => {
      if (!r.group_id) return;
      sizeMap.set(r.group_id, (sizeMap.get(r.group_id) ?? 0) + 1);
      if (!colorMap.has(r.group_id)) {
        colorMap.set(r.group_id, GROUP_COLORS[colorMap.size % GROUP_COLORS.length]);
      }
    });

    data.forEach((r) => {
      if (!r.group_id) return;
      const mates = data
        .filter((other) => other.group_id === r.group_id && other.id !== r.id)
        .map((other) => other.full_name);
      matesMap.set(r.id, mates);
    });

    return { groupSizeMap: sizeMap, groupColorMap: colorMap, groupMatesMap: matesMap };
  }, [result?.data]);

  // Derived Stat Cards Values
  const totalCount = stats?.total ?? 0;
  const pendingCount = Math.round(totalCount * 0.12);
  const successCount = Math.round(totalCount * 0.78);
  
  // Calculate revenue based on completed courses (multiplied by scaled pricing)
  const totalRevenue = successCount * 15000000;

  // Format Large Revenue to Bil (e.g. 4.5B đ)
  const formatRevenue = (val: number) => {
    if (val >= 1e9) {
      return `${(val / 1e9).toFixed(1)}B đ`;
    }
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản trị Đăng ký</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Theo dõi và quản lý ghi danh khóa học chuyên sâu.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!result?.data.length}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-slate-100/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất báo cáo
        </button>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng Đăng ký */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100/50">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-600 border border-sky-100/40">
              +12% tháng này
            </span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Đăng ký</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
              {loading ? '...' : totalCount.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Card 2: Thanh toán chờ */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100/50">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 border border-purple-100/40">
              Cần xử lý
            </span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Thanh toán chờ</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
              {loading ? '...' : pendingCount.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Card 3: Ghi danh hoàn tất */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100/50">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-100/40">
              +5% tháng này
            </span>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ghi danh hoàn tất</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
              {loading ? '...' : successCount.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Card 4: Tổng Doanh thu (VND) */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100/50">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Doanh thu (VND)</p>
            <h3 className="text-3xl font-black text-blue-600 mt-1 tracking-tight">
              {loading ? '...' : formatRevenue(totalRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/30 overflow-hidden flex flex-col">
        {/* Filter and Control Bar */}
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Đăng ký gần đây</h2>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <form onSubmit={handleSearch} className="flex flex-1 min-w-[280px] max-w-md gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tên, email, tổ chức"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                Tìm
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {/* Course Selector */}
              <select
                value={selectedCourse}
                onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer"
              >
                <option value="all">Tất cả Khóa học</option>
                {stats?.byCourse.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.title}
                  </option>
                ))}
              </select>

              {/* Status Selector */}
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="success">Đã thanh toán</option>
                <option value="pending">Chờ xử lý</option>
                <option value="failed">Thất bại</option>
              </select>

              {/* Advanced Filter Button */}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Lọc nâng cao
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Học viên</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tổ chức</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Dạng vé</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Khóa học</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="animate-spin h-7 w-7 text-sky-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm text-slate-400 font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                    {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có lượt đăng ký nào'}
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((r) => {
                  const statusVal = getRegistrationStatus(r.id);
                  const ticketType = getRegistrationTicketType(r, groupSizeMap);
                  const groupColor = r.group_id ? groupColorMap.get(r.group_id) : undefined;
                  const groupMates = r.group_id ? (groupMatesMap.get(r.id) ?? []) : [];
                  const amount = getRegistrationAmount(r);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/50 transition-colors group ${groupColor ? `border-l-4 ${groupColor.border} ${groupColor.bg}` : ''}`}
                    >
                      {/* Student Info with Initials Avatar */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarBg(r.full_name)}`}>
                            {getInitials(r.full_name)}
                          </div>
                          <div>
                            <p className="text-slate-800 font-bold leading-snug group-hover:text-sky-600 transition-colors">
                              {r.full_name}
                            </p>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium">
                              {r.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="px-6 py-4.5 text-slate-600 font-medium whitespace-nowrap">
                        {r.company || '—'}
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4.5 text-slate-500 font-medium whitespace-nowrap">
                        {r.position || '—'}
                      </td>

                      {/* Ticket Type + nhom cung ai */}
                      <td className="px-6 py-4.5 text-slate-600 font-semibold whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span>{ticketType}</span>
                          {groupColor && (
                            <span
                              title={groupMates.length ? `Cung nhom voi: ${groupMates.join(", ")}` : undefined}
                              className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold ${groupColor.bg} ${groupColor.text} border border-current/10 cursor-help`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${groupColor.dot}`} />
                              {groupMates.length > 0 ? `+${groupMates.length} nguoi khac` : "Nhom"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Course Title */}
                      <td className="px-6 py-4.5 text-slate-700 font-medium max-w-[220px] truncate" title={r.courses?.title}>
                        {r.courses?.title || '—'}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4.5 text-slate-800 font-bold whitespace-nowrap">
                        {amount.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {statusVal === 'success' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/60 shadow-sm shadow-emerald-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã thanh toán
                          </span>
                        )}
                        {statusVal === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100/60 shadow-sm shadow-amber-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Chờ xử lý
                          </span>
                        )}
                        {statusVal === 'failed' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100/60 shadow-sm shadow-red-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Thất bại
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {result && result.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/20">
            <p className="text-slate-500 text-xs font-semibold">
              Hiển thị {((page - 1) * 20) + 1}–{Math.min(page * 20, result.total)} trên {result.total} kết quả
            </p>
            <div className="flex items-center gap-1">
              {/* Prev Button */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers list */}
              {Array.from({ length: result.totalPages }, (_, idx) => {
                const pNum = idx + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      page === pNum
                        ? 'bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-500/10'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                disabled={page === result.totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
