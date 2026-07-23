'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getRegistrations, getAdminStats, getCourses } from '@/lib/portal/admin/api';
import type { Registration, RegistrationsPage, AdminStats, Course } from '@/lib/portal/admin/api';
import { adjustCourseStatus, sortCoursesSmart } from '@/lib/portal/utils/course';

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

// Bảng màu cho thẻ nhóm
const GROUP_THEMES = [
  { border: 'border-sky-200', bg: 'bg-sky-50/40', badgeBg: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  { border: 'border-purple-200', bg: 'bg-purple-50/40', badgeBg: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  { border: 'border-emerald-200', bg: 'bg-emerald-50/40', badgeBg: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { border: 'border-amber-200', bg: 'bg-amber-50/40', badgeBg: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  { border: 'border-rose-200', bg: 'bg-rose-50/40', badgeBg: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  { border: 'border-teal-200', bg: 'bg-teal-50/40', badgeBg: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
];

function getRegistrationTicketType(r: Registration, groupSizeMap: Map<string, number>): string {
  if (r.plan === 'early_bird') return 'Early Bird';
  if (r.plan === 'group_2') return 'Nhóm 2 người';
  if (r.plan === 'group_4') return 'Nhóm 4 người';
  if (r.plan === 'group') {
    const size = r.group_id ? groupSizeMap.get(r.group_id) ?? 2 : 2;
    return `Nhóm ${size} người`;
  }
  return '1 người';
}

function getRegistrationAmount(r: Registration): number {
  const basePrice = r.plan === 'group' || r.plan === 'group_2' || r.plan === 'group_4'
    ? (r.courses?.price_group || 0)
    : r.plan === 'early_bird'
    ? Math.round((r.courses?.price || 0) * 0.73)
    : (r.courses?.price || 0);

  const discount = r.discount_amount || 0;
  return Math.max(0, basePrice - discount);
}

interface CourseGroupData {
  course: Course | { id: string; title: string; category?: string };
  totalRegistrations: number;
  groups: Map<string, Registration[]>;
  individuals: Registration[];
}

export default function DangKyPage() {
  const [result, setResult] = useState<RegistrationsPage | null>(null);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection & View States
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'by_course' | 'table'>('by_course');
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [page, setPage] = useState(1);

  // Selected registration for details modal
  const [selectedDetailRegistration, setSelectedDetailRegistration] = useState<Registration | null>(null);

  // Per-Course Dedicated Filters State
  const [courseFilters, setCourseFilters] = useState<Record<string, { search: string; type: 'all' | 'group' | 'individual' }>>({});

  const updateCourseFilter = (cId: string, key: 'search' | 'type', val: string) => {
    setCourseFilters((prev) => ({
      ...prev,
      [cId]: {
        search: prev[cId]?.search ?? '',
        type: prev[cId]?.type ?? 'all',
        [key]: val,
      },
    }));
  };

  // Load registrations, stats, courses
  const loadData = useCallback(async (pg: number, q: string, cId: string) => {
    setLoading(true);
    setError('');
    try {
      const [listData, statsData, coursesRes] = await Promise.all([
        getRegistrations({
          page: pg,
          limit: 100,
          search: q || undefined,
          courseId: cId === 'all' ? undefined : cId,
        }),
        getAdminStats(),
        getCourses({ limit: 100 }),
      ]);
      setResult(listData);
      const adjusted = (coursesRes.items || []).map(adjustCourseStatus);
      setCoursesList(sortCoursesSmart(adjusted));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page, globalSearch, selectedCourseId);
  }, [loadData, page, globalSearch, selectedCourseId]);

  function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setGlobalSearch(globalSearchInput);
  }

  function clearAllFilters() {
    setGlobalSearchInput('');
    setGlobalSearch('');
    setSelectedCourseId('all');
    setCourseFilters({});
    setPage(1);
  }

  const groupSizeMap = useMemo(() => {
    const sizeMap = new Map<string, number>();
    (result?.data ?? []).forEach((r) => {
      if (r.plan === 'group' && r.group_id) {
        sizeMap.set(r.group_id, (sizeMap.get(r.group_id) ?? 0) + 1);
      }
    });
    return sizeMap;
  }, [result?.data]);

  const groupMembersMap = useMemo(() => {
    const map = new Map<string, Registration[]>();
    (result?.data ?? []).forEach((r) => {
      if (r.plan === 'group' && r.group_id) {
        if (!map.has(r.group_id)) {
          map.set(r.group_id, []);
        }
        map.get(r.group_id)!.push(r);
      }
    });
    return map;
  }, [result?.data]);

  const rawData = result?.data ?? [];

  const coursesGroupedData = useMemo(() => {
    const map = new Map<string, CourseGroupData>();

    coursesList.forEach((c) => {
      if (selectedCourseId === 'all' || selectedCourseId === c.id) {
        map.set(c.id, {
          course: c,
          totalRegistrations: 0,
          groups: new Map<string, Registration[]>(),
          individuals: [],
        });
      }
    });

    rawData.forEach((r) => {
      const cId = r.course_id;
      if (!map.has(cId)) {
        if (selectedCourseId === 'all' || selectedCourseId === cId) {
          map.set(cId, {
            course: { id: cId, title: r.courses?.title || 'Khóa học', category: 'General' },
            totalRegistrations: 0,
            groups: new Map<string, Registration[]>(),
            individuals: [],
          });
        } else {
          return;
        }
      }

      const itemGroup = map.get(cId)!;
      itemGroup.totalRegistrations += 1;

      if (r.plan === 'group' && r.group_id) {
        if (!itemGroup.groups.has(r.group_id)) {
          itemGroup.groups.set(r.group_id, []);
        }
        itemGroup.groups.get(r.group_id)!.push(r);
      } else {
        itemGroup.individuals.push(r);
      }
    });

    if (globalSearch) {
      const activeMap = new Map<string, CourseGroupData>();
      map.forEach((val, key) => {
        if (val.totalRegistrations > 0) {
          activeMap.set(key, val);
        }
      });
      return activeMap;
    }

    return map;
  }, [coursesList, rawData, selectedCourseId, globalSearch]);

  function exportCsv() {
    if (!rawData.length) return;
    const header = 'ID,Họ tên,Điện thoại,Email,Công ty,Chức vụ,Dạng vé,Nguồn,Khóa học,Số tiền,Ngày đăng ký';
    const rows = rawData.map((r) => {
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
        new Date(r.created_at).toLocaleString('vi-VN'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dang-ky-${selectedCourseId === 'all' ? 'tat-ca-khoa' : 'khoa-hoc'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản trị Đăng ký theo Khóa học</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Danh sách đăng ký được phân loại riêng biệt cho từng khóa học, bấm "Chi tiết" để xem toàn bộ thông tin đăng ký của khách hàng.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!rawData.length}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất báo cáo
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* ── COURSE NAVIGATION TABS BAR ───────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Lọc khóa học hiển thị
          </span>
          {selectedCourseId !== 'all' && (
            <button
              onClick={() => setSelectedCourseId('all')}
              className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
            >
              ← Xem tất cả khóa học
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCourseId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCourseId === 'all'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả khóa học ({result?.total ?? 0})
          </button>

          {coursesList.map((c) => {
            const isSel = selectedCourseId === c.id;
            const courseData = coursesGroupedData.get(c.id);
            const count = courseData?.totalRegistrations ?? 0;
            const isCompleted = c.status === 'completed';

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSel
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : isCompleted
                    ? 'bg-slate-100/70 text-slate-400 hover:bg-slate-200/80 border border-dashed border-slate-300/60'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={isCompleted ? 'Khóa học đã kết thúc' : undefined}
              >
                <span>{isCompleted ? `🔒 ${c.title} (Đã kết thúc)` : c.title}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSel ? 'bg-white/20 text-white' : isCompleted ? 'bg-slate-200/80 text-slate-500' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GLOBAL CONTROL BAR & VIEW MODES ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Global Search Input */}
        <form onSubmit={handleGlobalSearch} className="flex flex-1 min-w-[260px] max-w-md gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={globalSearchInput}
              onChange={(e) => setGlobalSearchInput(e.target.value)}
              placeholder="Tìm kiếm tổng hợp toàn hệ thống..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Tìm
          </button>
        </form>

        <div className="flex items-center gap-3">
          {/* Switch View Mode */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('by_course')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'by_course' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              📚 Phân khối theo Khóa học
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              📋 Bảng tổng hợp
            </button>
          </div>

          <button
            onClick={clearAllFilters}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {/* ── MODE 1: COURSE BY COURSE BLOCKS WITH PER-COURSE FILTERS ── */}
      {viewMode === 'by_course' && (
        <div className="space-y-8">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-100">
              <svg className="animate-spin h-7 w-7 text-sky-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Đang tải dữ liệu khóa học...</span>
            </div>
          ) : coursesGroupedData.size === 0 ? (
            <div className="py-20 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
              Không tìm thấy khóa học hoặc lượt đăng ký nào phù hợp.
            </div>
          ) : (
            Array.from(coursesGroupedData.entries()).map(([cId, courseBlock]) => {
              const { course, totalRegistrations, groups, individuals } = courseBlock;
              
              const currentCourseFilter = courseFilters[cId] || { search: '', type: 'all' };
              const courseSearch = currentCourseFilter.search.toLowerCase();
              const courseType = currentCourseFilter.type;

              const filteredGroupsEntries = Array.from(groups.entries()).filter(([_, members]) => {
                if (courseType === 'individual') return false;
                if (!courseSearch) return true;
                return members.some((m) =>
                  m.full_name.toLowerCase().includes(courseSearch) ||
                  m.email.toLowerCase().includes(courseSearch) ||
                  m.phone.includes(courseSearch) ||
                  (m.company && m.company.toLowerCase().includes(courseSearch))
                );
              });

              const filteredIndividuals = individuals.filter((ind) => {
                if (courseType === 'group') return false;
                if (!courseSearch) return true;
                return (
                  ind.full_name.toLowerCase().includes(courseSearch) ||
                  ind.email.toLowerCase().includes(courseSearch) ||
                  ind.phone.includes(courseSearch) ||
                  (ind.company && ind.company.toLowerCase().includes(courseSearch))
                );
              });

              const totalGroupsCount = groups.size;
              const totalGroupMembersCount = Array.from(groups.values()).reduce((sum, g) => sum + g.length, 0);

              return (
                <div
                  key={cId}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden space-y-5 p-6"
                >
                  {/* COURSE HEADER BANNER */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-md shadow-sky-500/20">
                        📚
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                            {'category' in course ? course.category : 'Khóa học'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">• ID: {cId.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">
                          {course.title}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                        Tổng: <span className="text-sky-600 font-extrabold text-sm">{totalRegistrations}</span> lượt đăng ký
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                        👥 {totalGroupsCount} Nhóm ({totalGroupMembersCount} người)
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
                        👤 {individuals.length} Cá nhân
                      </div>
                    </div>
                  </div>

                  {/* ── BỘ LỌC RIÊNG DÀNH CHO KHÓA HỌC NÀY ───────────── */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
                      <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={currentCourseFilter.search}
                          onChange={(e) => updateCourseFilter(cId, 'search', e.target.value)}
                          placeholder={`Lọc học viên trong khóa ${course.title}...`}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-all"
                        />
                      </div>
                      {currentCourseFilter.search && (
                        <button
                          type="button"
                          onClick={() => updateCourseFilter(cId, 'search', '')}
                          className="text-[10px] text-slate-400 hover:text-slate-700 font-bold px-1"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Phân loại:</span>
                      <button
                        type="button"
                        onClick={() => updateCourseFilter(cId, 'type', 'all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          courseType === 'all'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Tất cả ({totalRegistrations})
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCourseFilter(cId, 'type', 'group')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          courseType === 'group'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        👥 Chỉ xem Nhóm ({totalGroupMembersCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCourseFilter(cId, 'type', 'individual')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          courseType === 'individual'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        👤 Chỉ xem Cá nhân ({individuals.length})
                      </button>
                    </div>
                  </div>

                  {totalRegistrations === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      Chưa có học viên nào đăng ký cho khóa học này.
                    </div>
                  ) : filteredGroupsEntries.length === 0 && filteredIndividuals.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                      Không tìm thấy kết quả phù hợp với bộ lọc trong khóa học này.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* SECTION 1: CÁC NHÓM ĐĂNG KÝ CỦA KHÓA HỌC NÀY */}
                      {filteredGroupsEntries.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                            <span>👥 CÁC NHÓM ĐĂNG KÝ ({filteredGroupsEntries.length} Nhóm)</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filteredGroupsEntries.map(([gId, members], gIdx) => {
                              const theme = GROUP_THEMES[gIdx % GROUP_THEMES.length];
                              const totalGroupAmount = members.reduce((sum, m) => sum + getRegistrationAmount(m), 0);

                              return (
                                <div
                                  key={gId}
                                  className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 flex flex-col justify-between shadow-xs space-y-4`}
                                >
                                  {/* Group Header */}
                                  <div className="flex items-center justify-between border-b border-current/10 pb-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                                      <span className="font-black text-slate-800 text-sm">
                                        Mã Nhóm #{gId.slice(0, 8).toUpperCase()}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${theme.badgeBg}`}>
                                        {members.length} THÀNH VIÊN
                                      </span>
                                    </div>
                                    <span className="text-xs font-black text-slate-800">
                                      {totalGroupAmount.toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>

                                  {/* Group Members List */}
                                  <div className="space-y-2.5">
                                    {members.map((m, mIdx) => {
                                      return (
                                        <div
                                          key={m.id}
                                          className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-3 shadow-2xs"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(m.full_name)}`}>
                                              {getInitials(m.full_name)}
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 text-xs">{m.full_name}</p>
                                                {mIdx === 0 && (
                                                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-sky-100 text-sky-700 rounded-full">
                                                    Trưởng nhóm
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[11px] text-slate-400 font-medium">
                                                📞 {m.phone} • ✉️ {m.email}
                                              </p>
                                              {m.company && (
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                  🏢 {m.company} {m.position ? `(${m.position})` : ''}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => setSelectedDetailRegistration(m)}
                                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-extrabold transition-all cursor-pointer border border-sky-100 shrink-0"
                                          >
                                            Chi tiết
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SECTION 2: ĐĂNG KÝ CÁ NHÂN CỦA KHÓA HỌC NÀY */}
                      {filteredIndividuals.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-2">
                            <span>👤 ĐĂNG KÝ CÁ NHÂN ({filteredIndividuals.length} Học viên)</span>
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredIndividuals.map((ind) => {
                              const amount = getRegistrationAmount(ind);

                              return (
                                <div
                                  key={ind.id}
                                  className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-4 flex flex-col justify-between space-y-3 hover:border-sky-300 transition-all"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(ind.full_name)}`}>
                                        {getInitials(ind.full_name)}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-800 text-xs">{ind.full_name}</p>
                                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{ind.email}</p>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-sky-100 text-sky-700">
                                      CÁ NHÂN
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-100">
                                    <p>📞 <strong>SĐT:</strong> {ind.phone}</p>
                                    {ind.company && <p className="truncate">🏢 <strong>Tổ chức:</strong> {ind.company}</p>}
                                    <p>💵 <strong>Học phí:</strong> <span className="font-bold text-slate-800">{amount.toLocaleString('vi-VN')} đ</span></p>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 border-t border-slate-200/60">
                                    <span>Ngày đăng ký: {new Date(ind.created_at).toLocaleDateString('vi-VN')}</span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDetailRegistration(ind)}
                                      className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-extrabold transition-all cursor-pointer shadow-xs"
                                    >
                                      Chi tiết
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── MODE 2: TABLE VIEW ───────────────────────────── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Học viên</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tổ chức</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Dạng vé</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Khóa học</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : rawData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                      Không tìm thấy lượt đăng ký nào
                    </td>
                  </tr>
                ) : (
                  rawData.map((r) => {
                    const ticketType = getRegistrationTicketType(r, groupSizeMap);
                    const amount = getRegistrationAmount(r);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(r.full_name)}`}>
                              {getInitials(r.full_name)}
                            </div>
                            <div>
                              <p className="text-slate-800 font-bold leading-snug">{r.full_name}</p>
                              <p className="text-slate-400 text-xs mt-0.5 font-medium">{r.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{r.company || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 font-semibold whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              r.plan === 'group' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-sky-50 text-sky-700 border border-sky-100'
                            }`}>
                              {ticketType}
                            </span>
                            {r.plan === 'group' && r.group_id && (
                              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded-md border border-purple-200" title={`Mã nhóm: ${r.group_id}`}>
                                Mã nhóm: #{r.group_id.slice(0, 6).toUpperCase()}
                              </span>
                            )}
                            {r.promo_code && (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200" title={`Mã KM: ${r.promo_code}`}>
                                🎟️ {r.promo_code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium max-w-[200px] truncate" title={r.courses?.title}>
                          {r.courses?.title || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-bold whitespace-nowrap">
                          {amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailRegistration(r)}
                            className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-extrabold transition-all cursor-pointer border border-sky-100"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL CHI TIẾT THÔNG TIN HỌC VIÊN ĐĂNG KÝ ────────── */}
      {selectedDetailRegistration && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-black text-sm shrink-0 ${getAvatarBg(selectedDetailRegistration.full_name)}`}>
                  {getInitials(selectedDetailRegistration.full_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-800">{selectedDetailRegistration.full_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700">
                      {selectedDetailRegistration.plan === 'group' ? 'ĐĂNG KÝ NHÓM' : 'ĐĂNG KÝ CÁ NHÂN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Mã Đăng ký #{selectedDetailRegistration.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailRegistration(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Details Grid */}
            <div className="space-y-3.5 text-xs">
              {/* Personal Details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">👤 Thông tin cá nhân</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                  <p><strong>Họ và tên:</strong> {selectedDetailRegistration.full_name}</p>
                  <p><strong>Số điện thoại:</strong> {selectedDetailRegistration.phone}</p>
                  <p className="col-span-2"><strong>Email:</strong> {selectedDetailRegistration.email}</p>
                  <p><strong>Công ty/Tổ chức:</strong> {selectedDetailRegistration.company || '—'}</p>
                  <p><strong>Chức vụ/Vị trí:</strong> {selectedDetailRegistration.position || '—'}</p>
                </div>
              </div>

              {/* Group Members List if Group Plan */}
              {selectedDetailRegistration.plan === 'group' && selectedDetailRegistration.group_id && (
                <div className="bg-purple-50/70 p-3.5 rounded-2xl space-y-2 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                      👥 Thành viên đăng ký chung nhóm này
                    </h4>
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Mã #{selectedDetailRegistration.group_id.slice(0, 6).toUpperCase()} ({(groupMembersMap.get(selectedDetailRegistration.group_id) ?? []).length} người)
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {(groupMembersMap.get(selectedDetailRegistration.group_id) ?? []).map((gm, idx) => (
                      <div
                        key={gm.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          gm.id === selectedDetailRegistration.id
                            ? 'bg-purple-100/90 border-purple-300 font-bold text-purple-900 shadow-xs'
                            : 'bg-white border-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="leading-tight text-slate-800">
                              {gm.full_name} {gm.id === selectedDetailRegistration.id && <span className="text-[10px] text-purple-600 font-extrabold">(Đang chọn)</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">{gm.email} • 📞 {gm.phone}</p>
                          </div>
                        </div>
                        {gm.company && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold shrink-0">{gm.company}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course & Ticket Details */}
              <div className="bg-sky-50/50 p-3.5 rounded-2xl space-y-2 border border-sky-100">
                <h4 className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider">📚 Thông tin khóa học & Gói đăng ký</h4>
                <div className="space-y-1.5 text-slate-700 font-medium">
                  <p><strong>Khóa học:</strong> {selectedDetailRegistration.courses?.title || '—'}</p>
                  <p><strong>Dạng vé:</strong> {getRegistrationTicketType(selectedDetailRegistration, groupSizeMap)}</p>
                  {selectedDetailRegistration.group_id && (
                    <p><strong>Mã nhóm:</strong> #{selectedDetailRegistration.group_id.slice(0, 8).toUpperCase()}</p>
                  )}
                  {selectedDetailRegistration.promo_code && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 my-1">
                      <span className="text-emerald-700 font-extrabold text-xs">🎟️ Mã KM đã dùng:</span>
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-xs rounded-md tracking-wider shadow-2xs">
                        {selectedDetailRegistration.promo_code}
                      </span>
                      {selectedDetailRegistration.discount_amount ? (
                        <span className="text-emerald-700 text-xs font-bold">
                          (-{selectedDetailRegistration.discount_amount.toLocaleString('vi-VN')} đ)
                        </span>
                      ) : null}
                    </div>
                  )}
                  <p><strong>Học phí:</strong> <span className="font-bold text-slate-900 text-sm">{getRegistrationAmount(selectedDetailRegistration).toLocaleString('vi-VN')} đ</span></p>
                </div>
              </div>

              {/* Referral & Registration Date */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">📣 Thông tin bổ sung</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                  <p><strong>Nguồn biết đến:</strong> {selectedDetailRegistration.referral || 'Chưa ghi nhận'}</p>
                  <p><strong>Thời gian gửi:</strong> {new Date(selectedDetailRegistration.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedDetailRegistration.phone);
                  alert(`Đã sao chép SĐT: ${selectedDetailRegistration.phone}`);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                📋 Sao chép SĐT
              </button>
              <button
                type="button"
                onClick={() => setSelectedDetailRegistration(null)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-sky-500/20"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
