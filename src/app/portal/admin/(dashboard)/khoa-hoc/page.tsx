'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getInstructorOptions,
  uploadCourseThumbnail,
  updateCourseModules,
  getCourseModules,
  getActivePromos,
} from '@/lib/portal/admin/api';
import type { Course, CourseFormInput, CourseStatus, InstructorOption, CourseModuleInput, ActivePromoMap } from '@/lib/portal/admin/api';
import { compressImage } from '@/lib/image-compression';

const LIMIT = 10;

// ── Helpers ─────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatVnd(value: number): string {
  return value.toLocaleString('vi-VN') + 'đ';
}

const EMPTY_FORM: CourseFormInput = {
  title: '',
  slug: '',
  description: '',
  thumbnail_url: '',
  status: 'upcoming',
  category: '',
  start_date: '',
  schedule_time: '',
  location: '',
  location_url: '',
  price: 0,
  price_group: 0,
  instructor_id: '',
  skills: [],
  curriculum_headline: '',
  qr_early_bird: '',
  qr_individual: '',
  qr_group_2: '',
  qr_group_4: '',
  qr_early_bird_promo: '',
  qr_individual_promo: '',
  qr_group_2_promo: '',
  qr_group_4_promo: '',
  plans_config: undefined,
  early_bird_deadline: '',
};

export default function KhoaHocPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseFormInput>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'info' | 'skills' | 'modules' | 'register'>('info');

  // Modules state
  const [formModules, setFormModules] = useState<CourseModuleInput[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Skills dynamic edit helpers
  function addSkill() {
    setForm((f) => ({
      ...f,
      skills: [...(f.skills ?? []), { title: '', description: '', badge: '' }],
    }));
  }

  function handleSkillChange(index: number, field: string, value: string) {
    setForm((f) => {
      const newSkills = [...(f.skills ?? [])];
      newSkills[index] = { ...newSkills[index], [field]: value };
      return { ...f, skills: newSkills };
    });
  }

  function removeSkill(index: number) {
    setForm((f) => ({
      ...f,
      skills: (f.skills ?? []).filter((_, idx) => idx !== index),
    }));
  }

  // Modules dynamic edit helpers
  function addModule() {
    setFormModules((prev) => [
      ...prev,
      { title: '', subtitle: '', duration_minutes: 30, start_time: '', item_type: 'module' },
    ]);
  }

  function handleModuleChange(index: number, field: keyof CourseModuleInput, value: any) {
    setFormModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeModule(index: number) {
    setFormModules((prev) => prev.filter((_, idx) => idx !== index));
  }

  function moveModule(index: number, direction: 'up' | 'down') {
    setFormModules((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }

  // QR Upload state
  const [qrUploading, setQrUploading] = useState<Record<string, boolean>>({});
  const [qrUploadError, setQrUploadError] = useState<Record<string, string>>({});

  // Active promos state (fetch khi mở edit modal)
  const [activePromos, setActivePromos] = useState<ActivePromoMap>({});

  async function handleQrUpload(
    field:
      | 'qr_early_bird' | 'qr_individual' | 'qr_group_2' | 'qr_group_4'
      | 'qr_early_bird_promo' | 'qr_individual_promo' | 'qr_group_2_promo' | 'qr_group_4_promo',
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrUploading((prev) => ({ ...prev, [field]: true }));
    setQrUploadError((prev) => ({ ...prev, [field]: '' }));

    try {
      const compressed = await compressImage(file);
      if (compressed.size > 5 * 1024 * 1024) {
        setQrUploadError((prev) => ({ ...prev, [field]: 'Kích thước ảnh sau nén vẫn vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.' }));
        return;
      }
      const publicUrl = await uploadCourseThumbnail(compressed);
      setForm((f) => ({ ...f, [field]: publicUrl }));
    } catch (err) {
      console.error(`QR Upload failed for ${field}:`, err);
      setQrUploadError((prev) => ({ ...prev, [field]: err instanceof Error ? err.message : 'Tải ảnh lên thất bại' }));
    } finally {
      setQrUploading((prev) => ({ ...prev, [field]: false }));
    }
  }

  function updatePlanConfig(planKey: string, field: string, value: any) {
    setForm((f) => {
      const plansConfig = f.plans_config ? { ...f.plans_config } : {};
      const planDetail = plansConfig[planKey] ? { ...plansConfig[planKey] } : {};
      if (value === '' || value === undefined) {
        delete planDetail[field];
      } else {
        planDetail[field] = value;
      }
      if (Object.keys(planDetail).length === 0) {
        delete plansConfig[planKey];
      } else {
        plansConfig[planKey] = planDetail;
      }
      return {
        ...f,
        plans_config: Object.keys(plansConfig).length === 0 ? undefined : plansConfig,
      };
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const compressed = await compressImage(file);
      if (compressed.size > 5 * 1024 * 1024) {
        setUploadError('Kích thước ảnh sau nén vẫn vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      const publicUrl = await uploadCourseThumbnail(compressed);
      setForm((f) => ({ ...f, thumbnail_url: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
    }
  }

  const loadData = useCallback(async (pg: number, q: string, st: CourseStatus | 'all') => {
    setLoading(true);
    setError('');
    try {
      const res = await getCourses({ page: pg, limit: LIMIT, search: q || undefined, status: st });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page, search, statusFilter);
  }, [loadData, page, search, statusFilter]);

  useEffect(() => {
    getInstructorOptions().then(setInstructors).catch(() => setInstructors([]));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  }

  // Stats
  const totalCount = pagination.total;
  const upcomingCount = useMemo(() => items.filter((c) => c.status === 'upcoming').length, [items]);
  const completedCount = useMemo(() => items.filter((c) => c.status === 'completed').length, [items]);

  // ── Modal handlers ─────────────────────────────────
  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormModules([]);
    setSlugTouched(false);
    setFormError('');
    setUploading(false);
    setUploadError('');
    setQrUploading({});
    setQrUploadError({});
    setActivePromos({});
    setActiveTab('info');
    setModalOpen(true);
  }

  function openEditModal(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description ?? '',
      thumbnail_url: course.thumbnail_url ?? '',
      status: course.status,
      category: course.category ?? '',
      start_date: course.start_date ? course.start_date.slice(0, 10) : '',
      schedule_time: course.schedule_time ?? '',
      location: course.location ?? '',
      location_url: course.location_url ?? '',
      price: course.price,
      price_group: course.price_group,
      instructor_id: course.instructor_id,
      skills: course.skills ?? [],
      curriculum_headline: course.curriculum_headline ?? '',
      qr_early_bird: course.qr_early_bird ?? '',
      qr_individual: course.qr_individual ?? '',
      qr_group_2: course.qr_group_2 ?? '',
      qr_group_4: course.qr_group_4 ?? '',
      qr_early_bird_promo: course.qr_early_bird_promo ?? '',
      qr_individual_promo: course.qr_individual_promo ?? '',
      qr_group_2_promo: course.qr_group_2_promo ?? '',
      qr_group_4_promo: course.qr_group_4_promo ?? '',
      plans_config: course.plans_config ?? undefined,
      early_bird_deadline: course.early_bird_deadline ?? '',
    });

    // Fetch promo đang active để biết gói nào đang có KM
    setActivePromos({});
    getActivePromos(course.id)
      .then(setActivePromos)
      .catch(() => setActivePromos({}));
    setSlugTouched(true);
    setFormError('');
    setUploading(false);
    setUploadError('');
    setQrUploading({});
    setQrUploadError({});
    setActiveTab('info');
    setModalOpen(true);

    // Fetch modules
    setLoadingModules(true);
    getCourseModules(course.id)
      .then(setFormModules)
      .catch((err) => {
        console.error('Failed to load modules:', err);
        setFormModules([]);
      })
      .finally(() => setLoadingModules(false));
  }

  function closeModal() {
    if (saving || uploading || Object.values(qrUploading).some(Boolean) || loadingModules) return;
    setModalOpen(false);
  }

  function handleTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim() || !form.slug.trim() || !form.category.trim() || !form.instructor_id) {
      setFormError('Vui lòng điền đầy đủ Tiêu đề, Slug, Danh mục và Giảng viên.');
      return;
    }

    setSaving(true);
    try {
      const payload: CourseFormInput = {
        ...form,
        price: Number(form.price) || 0,
        price_group: Number(form.price_group) || 0,
        start_date: form.start_date || undefined,
        schedule_time: form.schedule_time || undefined,
        location: form.location || undefined,
        location_url: form.location_url || undefined,
        thumbnail_url: form.thumbnail_url || undefined,
        skills: (form.skills ?? []).map((s) => ({
          title: s.title ? s.title.trim() : '',
          description: s.description ? s.description.trim() : '',
          badge: s.badge ? s.badge.trim() : undefined,
        })),
        curriculum_headline: form.curriculum_headline || undefined,
        qr_early_bird: form.qr_early_bird || undefined,
        qr_individual: form.qr_individual || undefined,
        qr_group_2: form.qr_group_2 || undefined,
        qr_group_4: form.qr_group_4 || undefined,
        qr_early_bird_promo: form.qr_early_bird_promo || undefined,
        qr_individual_promo: form.qr_individual_promo || undefined,
        qr_group_2_promo: form.qr_group_2_promo || undefined,
        qr_group_4_promo: form.qr_group_4_promo || undefined,
        plans_config: form.plans_config || undefined,
        early_bird_deadline: form.early_bird_deadline || undefined,
      };

      if (editingId) {
        await updateCourse(editingId, payload);
        await updateCourseModules(editingId, formModules);
      } else {
        const newCourse = await createCourse(payload);
        if (formModules.length > 0) {
          await updateCourseModules(newCourse.id, formModules);
        }
      }
      setModalOpen(false);
      loadData(editingId ? page : 1, search, statusFilter);
      if (!editingId) setPage(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lưu khóa học thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      loadData(nextPage, search, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa khóa học thất bại');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản trị Khóa học</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Thêm, chỉnh sửa, tìm kiếm và xóa khóa học trên hệ thống.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-sky-500/20 transition-colors cursor-pointer"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm khóa học
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng khóa học</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
              {loading ? '...' : totalCount.toLocaleString('vi-VN')}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100/50">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sắp khai giảng (trang này)</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
              {loading ? '...' : upcomingCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100/50">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm shadow-slate-100/40 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đã hoàn thành (trang này)</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">
              {loading ? '...' : completedCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100/50">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/30 overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Danh sách khóa học</h2>

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
                  placeholder="Tìm theo tên khóa học..."
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
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as CourseStatus | 'all'); setPage(1); }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="upcoming">Sắp khai giảng</option>
                <option value="completed">Đã hoàn thành</option>
              </select>

              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Xóa lọc
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Khóa học</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Giảng viên</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Khai giảng</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Học phí</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                    {search ? `Không tìm thấy khóa học cho "${search}"` : 'Chưa có khóa học nào'}
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4.5 max-w-[260px]">
                      <p className="text-slate-800 font-bold leading-snug truncate group-hover:text-sky-600 transition-colors" title={c.title}>
                        {c.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium truncate">/{c.slug}</p>
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 font-medium whitespace-nowrap">
                      {c.category || '—'}
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 font-medium whitespace-nowrap">
                      {c.instructors?.name ?? instructors.find((i) => i.id === c.instructor_id)?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 font-medium whitespace-nowrap">
                      {c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4.5 text-slate-800 font-bold whitespace-nowrap">
                      {formatVnd(c.price)}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {c.status === 'upcoming' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Sắp khai giảng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đã hoàn thành
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          title="Chỉnh sửa"
                          className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Xóa"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/20">
            <p className="text-slate-500 text-xs font-semibold">
              Hiển thị {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, pagination.total)} trên {pagination.total} kết quả
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: pagination.totalPages }, (_, idx) => {
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
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
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

      {/* ── Create / Edit Modal ─────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black text-slate-800">
                {editingId ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 sticky top-[68px] bg-white z-10 px-6">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Thông tin chung
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'skills'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Quyền lợi khóa học
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'modules'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Lịch trình & Module
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Cấu hình Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                  {formError}
                </div>
              )}

              {activeTab === 'info' && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Tiêu đề khóa học *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="VD: Làm chủ Claude AI cho doanh nghiệp"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Slug (đường dẫn) *
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
                      placeholder="lam-chu-claude-ai-cho-doanh-nghiep"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Mô tả
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="Mô tả ngắn gọn về khóa học..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all resize-none"
                    />
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Danh mục *
                      </label>
                      <input
                        type="text"
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        placeholder="VD: AI cho doanh nghiệp"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Trạng thái *
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CourseStatus }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer"
                      >
                        <option value="upcoming">Sắp khai giảng</option>
                        <option value="completed">Đã hoàn thành</option>
                      </select>
                    </div>
                  </div>

                  {/* Start date & Instructor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Ngày khai giảng
                      </label>
                      <input
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Giảng viên *
                      </label>
                      <select
                        value={form.instructor_id}
                        onChange={(e) => setForm((f) => ({ ...f, instructor_id: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all cursor-pointer"
                      >
                        <option value="">— Chọn giảng viên —</option>
                        {instructors.map((i) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Schedule Time & Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <span>⏰ Giờ bắt đầu / Khung giờ học</span>
                      </label>
                      <input
                        type="text"
                        value={form.schedule_time ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, schedule_time: e.target.value }))}
                        placeholder="VD: 8h30 - 17h00"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <span>📍 Tên Địa điểm học</span>
                      </label>
                      <input
                        type="text"
                        value={form.location ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        placeholder="VD: Trung tâm TPHCM"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Google Maps URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <span>🗺️ Link Google Maps địa chỉ (Nhấp vào sẽ mở GG Maps)</span>
                    </label>
                    <input
                      type="url"
                      value={form.location_url ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, location_url: e.target.value }))}
                      placeholder="VD: https://maps.google.com/?q=Ho+Chi+Minh"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Khi học viên bấm vào tên địa điểm ở trang chi tiết khóa học, hệ thống sẽ mở đường dẫn Google Maps này.</p>
                  </div>

                  {/* Price & Price group */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Học phí cá nhân (VNĐ) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Học phí nhóm (VNĐ) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.price_group}
                        onChange={(e) => setForm((f) => ({ ...f, price_group: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Thumbnail URL / Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Ảnh đại diện *
                    </label>
                    <div className="flex flex-col gap-3">
                      {form.thumbnail_url ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] w-full max-w-[320px] bg-slate-50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={form.thumbnail_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, thumbnail_url: '' }))}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md shadow-red-500/20"
                            title="Xóa ảnh"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full max-w-[320px] aspect-[16/9] border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-sky-50/10 transition-all group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Đang tải lên...</p>
                              </div>
                            ) : (
                              <>
                                <svg className="w-8 h-8 text-slate-400 group-hover:text-sky-500 transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs font-bold text-slate-600 group-hover:text-sky-600 transition-colors">Tải ảnh lên từ thiết bị</p>
                                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP (Tối đa 5MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploading}
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                      {uploadError && (
                        <p className="text-xs text-red-500 font-semibold">{uploadError}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'skills' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">Quyền lợi nhận được sau khóa học</p>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm quyền lợi
                    </button>
                  </div>

                  {(form.skills ?? []).length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <p className="text-slate-400 text-sm font-medium">Chưa có quyền lợi nào được thiết lập.</p>
                      <button
                        type="button"
                        onClick={addSkill}
                        className="text-sky-500 hover:text-sky-600 text-xs font-bold mt-2"
                      >
                        Thêm ngay
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
                      {(form.skills ?? []).map((s, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3 relative group/item">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-slate-400">Quyền lợi #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeSkill(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Xóa"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề</label>
                              <input
                                type="text"
                                value={s.title}
                                onChange={(e) => handleSkillChange(idx, 'title', e.target.value)}
                                placeholder="VD: Claude Cowork"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Badge (Nhãn)</label>
                              <input
                                type="text"
                                value={s.badge || ''}
                                onChange={(e) => handleSkillChange(idx, 'badge', e.target.value)}
                                placeholder="VD: Đặc biệt"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả chi tiết</label>
                            <textarea
                              value={s.description}
                              onChange={(e) => handleSkillChange(idx, 'description', e.target.value)}
                              rows={2}
                              placeholder="Mô tả ngắn gọn về quyền lợi này..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'modules' && (
                <div className="flex flex-col gap-4">
                  {/* Headline */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Tiêu đề chính của Lịch trình (Headline)
                    </label>
                    <input
                      type="text"
                      value={form.curriculum_headline || ''}
                      onChange={(e) => setForm((f) => ({ ...f, curriculum_headline: e.target.value }))}
                      placeholder="VD: 1 ngày – 6 module thực chiến"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-sm font-bold text-slate-700">Các hoạt động trong lịch trình học</p>
                    <button
                      type="button"
                      onClick={addModule}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm hoạt động
                    </button>
                  </div>

                  {loadingModules ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <svg className="animate-spin h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-xs text-slate-400 font-semibold">Đang tải lịch trình...</p>
                    </div>
                  ) : formModules.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <p className="text-slate-400 text-sm font-medium">Chưa thiết lập lịch trình hoạt động nào.</p>
                      <button
                        type="button"
                        onClick={addModule}
                        className="text-sky-500 hover:text-sky-600 text-xs font-bold mt-2"
                      >
                        Thêm hoạt động ngay
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
                      {formModules.map((m, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3 relative group/item">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-slate-400">Hoạt động #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveModule(idx, 'up')}
                                disabled={idx === 0}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                                title="Di chuyển lên"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveModule(idx, 'down')}
                                disabled={idx === formModules.length - 1}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                                title="Di chuyển xuống"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeModule(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-1"
                                title="Xóa"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142a2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên hoạt động/Module *</label>
                              <input
                                type="text"
                                value={m.title}
                                onChange={(e) => handleModuleChange(idx, 'title', e.target.value)}
                                placeholder="VD: Module 1: Tư duy dùng về AI"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Loại hoạt động *</label>
                              <select
                                value={m.item_type}
                                onChange={(e) => handleModuleChange(idx, 'item_type', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all cursor-pointer font-semibold"
                              >
                                <option value="module">Học tập (Module)</option>
                                <option value="break">Nghỉ ngơi/Giải lao (Break)</option>
                                <option value="event">Sự kiện (Check-in/Q&A)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả phụ (Subtitle)</label>
                              <input
                                type="text"
                                value={m.subtitle || ''}
                                onChange={(e) => handleModuleChange(idx, 'subtitle', e.target.value)}
                                placeholder="VD: Bộ 3: Mindset – Skillset..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bắt đầu</label>
                                <input
                                  type="text"
                                  value={m.start_time || ''}
                                  onChange={(e) => handleModuleChange(idx, 'start_time', e.target.value)}
                                  placeholder="08:30"
                                  className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all text-center"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phút *</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={m.duration_minutes}
                                  onChange={(e) => handleModuleChange(idx, 'duration_minutes', Number(e.target.value))}
                                  className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all text-center"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nội dung chi tiết (Mô tả)</label>
                            <textarea
                              value={m.description || ''}
                              onChange={(e) => handleModuleChange(idx, 'description', e.target.value)}
                              rows={1}
                              placeholder="Chi tiết hoạt động học tập (nếu có)..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-all resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'register' && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-700">Mã QR Thanh toán chuyển khoản</h4>
                    <p className="text-xs text-slate-400 mt-1">Cấu hình mã QR riêng biệt cho từng mức giá đăng ký của khóa học để học viên quét chuyển khoản chính xác số tiền.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-1">
                    {/* Early Bird */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                      <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-700 font-black">1. Gói Early Bird (Ưu đãi sớm)</span>
                        <span className="text-[11px] font-bold text-sky-500 mt-0.5">
                          Giá hiện hành: {formatVnd(form.plans_config?.early_bird?.price ?? form.price)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề hiển thị</label>
                          <input
                            type="text"
                            value={form.plans_config?.early_bird?.label ?? ''}
                            placeholder="Mặc định: Early Bird"
                            onChange={(e) => updatePlanConfig('early_bird', 'label', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả phụ</label>
                          <input
                            type="text"
                            value={form.plans_config?.early_bird?.sublabel ?? ''}
                            placeholder="Mặc định: 1 người · Ưu đãi có hạn"
                            onChange={(e) => updatePlanConfig('early_bird', 'sublabel', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                         <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Học phí tùy chỉnh (VNĐ)</label>
                          <input
                            type="number"
                            value={form.plans_config?.early_bird?.price ?? ''}
                            placeholder={`Mặc định: ${form.price}`}
                            onChange={(e) => updatePlanConfig('early_bird', 'price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hạn chót gói Early Bird</label>
                          <input
                            type="datetime-local"
                            value={form.early_bird_deadline ? form.early_bird_deadline.slice(0, 16) : ''}
                            onChange={(e) => setForm((f) => ({ ...f, early_bird_deadline: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hình ảnh QR chuyển khoản</label>
                          {form.qr_early_bird ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[2/1] w-full bg-white flex items-center justify-center">
                              <img src={form.qr_early_bird} alt="QR Early Bird" className="w-full h-full object-contain p-2" />
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, qr_early_bird: '' }))}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl cursor-pointer bg-white hover:bg-sky-50/10 transition-all group text-center">
                              <div className="flex flex-col items-center justify-center p-2">
                                {qrUploading['qr_early_bird'] ? (
                                  <svg className="animate-spin h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-sky-600">Tải ảnh QR</span>
                                  </>
                                )}
                              </div>
                              <input type="file" accept="image/*" disabled={qrUploading['qr_early_bird']} className="hidden" onChange={(e) => handleQrUpload('qr_early_bird', e)} />
                            </label>
                          )}
                          {qrUploadError?.['qr_early_bird'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_early_bird']}</p>}
                        </div>

                        {/* QR Khuyến mãi Early Bird — luôn hiện, không phụ thuộc khuyến mãi đang active */}
                        <div className="mt-1 pt-3 border-t border-amber-200">
                            {activePromos.early_bird && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase tracking-wide">🎁 Đang có KM</span>
                              <span className="text-[10px] text-amber-600 font-semibold">
                                Giảm {activePromos.early_bird.discount_type === 'percent'
                                  ? `${activePromos.early_bird.discount_value}%`
                                  : `${activePromos.early_bird.discount_value.toLocaleString('vi-VN')}đ`}
                                {' → '}
                                {activePromos.early_bird.discount_type === 'percent'
                                  ? formatVnd(Math.round((form.plans_config?.early_bird?.price ?? form.price) * (1 - activePromos.early_bird.discount_value / 100)))
                                  : formatVnd(Math.max(0, (form.plans_config?.early_bird?.price ?? form.price) - activePromos.early_bird.discount_value))
                                }
                              </span>
                            </div>
                            )}
                            <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">QR Sau Khuyến Mãi</label>
                            {form.qr_early_bird_promo ? (
                              <div className="relative group rounded-xl overflow-hidden border border-amber-200 aspect-[2/1] w-full bg-amber-50 flex items-center justify-center">
                                <img src={form.qr_early_bird_promo} alt="QR Early Bird KM" className="w-full h-full object-contain p-2" />
                                <button type="button" onClick={() => setForm((f) => ({ ...f, qr_early_bird_promo: '' }))}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-xl cursor-pointer bg-amber-50/30 hover:bg-amber-50 transition-all group text-center">
                                <div className="flex flex-col items-center justify-center p-2">
                                  {qrUploading['qr_early_bird_promo'] ? (
                                    <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      <span className="text-[11px] font-bold text-amber-600 group-hover:text-amber-700">Tải QR khuyến mãi</span>
                                    </>
                                  )}
                                </div>
                                <input type="file" accept="image/*" disabled={qrUploading['qr_early_bird_promo']} className="hidden" onChange={(e) => handleQrUpload('qr_early_bird_promo', e)} />
                              </label>
                            )}
                            {qrUploadError?.['qr_early_bird_promo'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_early_bird_promo']}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Individual */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                      <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-700 font-black">2. Gói Cá nhân</span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {form.plans_config?.individual?.original_price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              Gốc: {formatVnd(form.plans_config.individual.original_price)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề hiển thị</label>
                          <input
                            type="text"
                            value={form.plans_config?.individual?.label ?? ''}
                            placeholder="Mặc định: 1 người"
                            onChange={(e) => updatePlanConfig('individual', 'label', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả phụ</label>
                          <input
                            type="text"
                            value={form.plans_config?.individual?.sublabel ?? ''}
                            placeholder="Mặc định: Đăng ký cá nhân"
                            onChange={(e) => updatePlanConfig('individual', 'sublabel', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        {/* Giá gốc — hiển thị gạch ngang */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            💰 Giá gốc (VNĐ) — hiển thị gạch ngang
                          </label>
                          <input
                            type="number"
                            value={form.plans_config?.individual?.original_price ?? ''}
                            placeholder={`VD: ${form.price} (để trống = không gạch ngang)`}
                            onChange={(e) => updatePlanConfig('individual', 'original_price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                          {form.plans_config?.individual?.original_price ? (
                            <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                              → {formatVnd(form.plans_config.individual.original_price)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-0.5">Giá trước khi giảm, hiển thị gạch ngang trên form đăng ký</p>
                          )}
                        </div>
                        {/* Giá khuyến mãi — giá thực tính tiền */}
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            🏷️ Giá khuyến mãi (VNĐ) — giá tính tiền thực
                          </label>
                          <input
                            type="number"
                            value={form.plans_config?.individual?.price ?? ''}
                            placeholder={`Mặc định: ${form.price} (từ tab Thông tin)`}
                            onChange={(e) => updatePlanConfig('individual', 'price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                          />
                          {form.plans_config?.individual?.price && (
                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              → {formatVnd(form.plans_config.individual.price)}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hình ảnh QR chuyển khoản</label>
                          {form.qr_individual ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[2/1] w-full bg-white flex items-center justify-center">
                              <img src={form.qr_individual} alt="QR Individual" className="w-full h-full object-contain p-2" />
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, qr_individual: '' }))}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl cursor-pointer bg-white hover:bg-sky-50/10 transition-all group text-center">
                              <div className="flex flex-col items-center justify-center p-2">
                                {qrUploading['qr_individual'] ? (
                                  <svg className="animate-spin h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-sky-600">Tải ảnh QR</span>
                                  </>
                                )}
                              </div>
                              <input type="file" accept="image/*" disabled={qrUploading['qr_individual']} className="hidden" onChange={(e) => handleQrUpload('qr_individual', e)} />
                            </label>
                          )}
                          {qrUploadError?.['qr_individual'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_individual']}</p>}
                        </div>

                        {/* QR Khuyến mãi Individual — luôn hiện, không phụ thuộc khuyến mãi đang active */}
                        <div className="mt-1 pt-3 border-t border-amber-200">
                            {activePromos.individual && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase tracking-wide">🎁 Đang có KM</span>
                              <span className="text-[10px] text-amber-600 font-semibold">
                                Giảm {activePromos.individual.discount_type === 'percent'
                                  ? `${activePromos.individual.discount_value}%`
                                  : `${activePromos.individual.discount_value.toLocaleString('vi-VN')}đ`}
                                {' → '}
                                {activePromos.individual.discount_type === 'percent'
                                  ? formatVnd(Math.round((form.plans_config?.individual?.price ?? form.price) * (1 - activePromos.individual.discount_value / 100)))
                                  : formatVnd(Math.max(0, (form.plans_config?.individual?.price ?? form.price) - activePromos.individual.discount_value))
                                }
                              </span>
                            </div>
                            )}
                            <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">QR Sau Khuyến Mãi</label>
                            {form.qr_individual_promo ? (
                              <div className="relative group rounded-xl overflow-hidden border border-amber-200 aspect-[2/1] w-full bg-amber-50 flex items-center justify-center">
                                <img src={form.qr_individual_promo} alt="QR Individual KM" className="w-full h-full object-contain p-2" />
                                <button type="button" onClick={() => setForm((f) => ({ ...f, qr_individual_promo: '' }))}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-xl cursor-pointer bg-amber-50/30 hover:bg-amber-50 transition-all group text-center">
                                <div className="flex flex-col items-center justify-center p-2">
                                  {qrUploading['qr_individual_promo'] ? (
                                    <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      <span className="text-[11px] font-bold text-amber-600 group-hover:text-amber-700">Tải QR khuyến mãi</span>
                                    </>
                                  )}
                                </div>
                                <input type="file" accept="image/*" disabled={qrUploading['qr_individual_promo']} className="hidden" onChange={(e) => handleQrUpload('qr_individual_promo', e)} />
                              </label>
                            )}
                            {qrUploadError?.['qr_individual_promo'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_individual_promo']}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Group 2 */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                      <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-700 font-black">3. Gói Nhóm 2 người</span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {form.plans_config?.group_2?.original_price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              Gốc: {formatVnd(form.plans_config.group_2.original_price * 2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề hiển thị</label>
                          <input
                            type="text"
                            value={form.plans_config?.group_2?.label ?? ''}
                            placeholder="Mặc định: Nhóm 2 người"
                            onChange={(e) => updatePlanConfig('group_2', 'label', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả phụ</label>
                          <input
                            type="text"
                            value={form.plans_config?.group_2?.sublabel ?? ''}
                            placeholder={`Mặc định: ${formatVnd(form.price_group)}/người`}
                            onChange={(e) => updatePlanConfig('group_2', 'sublabel', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        {/* Giá gốc/người — dùng để hiển thị gạch ngang trên UI */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            💰 Giá gốc/người (VNĐ) — hiển thị gạch ngang
                          </label>
                          <input
                            type="number"
                            value={form.plans_config?.group_2?.original_price ?? ''}
                            placeholder={`VD: ${form.price} (giá cá nhân, để gạch ngang)`}
                            onChange={(e) => updatePlanConfig('group_2', 'original_price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                          {form.plans_config?.group_2?.original_price ? (
                            <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                              → {formatVnd(form.plans_config.group_2.original_price)}/người
                              &nbsp;·&nbsp;Tổng: {formatVnd(form.plans_config.group_2.original_price * 2)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-0.5">Giá trước khi giảm, hiển thị gạch ngang trên form đăng ký</p>
                          )}
                        </div>
                        {/* Giá khuyến mãi/người — giá thực tính tổng */}
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            🏷️ Giá khuyến mãi/người (VNĐ) — giá tính tiền thực
                          </label>
                          <input
                            type="number"
                            value={form.plans_config?.group_2?.price ?? ''}
                            placeholder={`Mặc định: ${form.price_group} (từ tab Thông tin)`}
                            onChange={(e) => updatePlanConfig('group_2', 'price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                          />
                          {form.plans_config?.group_2?.price ? (
                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              → {formatVnd(form.plans_config.group_2.price)}/người
                              &nbsp;·&nbsp;Tổng: {formatVnd(form.plans_config.group_2.price * 2)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-0.5">Tổng nhóm 2 người = giá này × 2</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hình ảnh QR chuyển khoản</label>
                          {form.qr_group_2 ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[2/1] w-full bg-white flex items-center justify-center">
                              <img src={form.qr_group_2} alt="QR Group 2" className="w-full h-full object-contain p-2" />
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, qr_group_2: '' }))}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl cursor-pointer bg-white hover:bg-sky-50/10 transition-all group text-center">
                              <div className="flex flex-col items-center justify-center p-2">
                                {qrUploading['qr_group_2'] ? (
                                  <svg className="animate-spin h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-sky-600">Tải ảnh QR</span>
                                  </>
                                )}
                              </div>
                              <input type="file" accept="image/*" disabled={qrUploading['qr_group_2']} className="hidden" onChange={(e) => handleQrUpload('qr_group_2', e)} />
                            </label>
                          )}
                          {qrUploadError?.['qr_group_2'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_group_2']}</p>}
                        </div>

                        {/* QR Khuyến mãi Group 2 — luôn hiện, không phụ thuộc khuyến mãi đang active */}
                        <div className="mt-1 pt-3 border-t border-amber-200">
                            {activePromos.group_2 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase tracking-wide">🎁 Đang có KM</span>
                              <span className="text-[10px] text-amber-600 font-semibold">
                                Giảm {activePromos.group_2.discount_type === 'percent'
                                  ? `${activePromos.group_2.discount_value}%`
                                  : `${activePromos.group_2.discount_value.toLocaleString('vi-VN')}đ`}
                                {' → '}
                                {activePromos.group_2.discount_type === 'percent'
                                  ? formatVnd(Math.round((form.plans_config?.group_2?.price ?? form.price_group) * (1 - activePromos.group_2.discount_value / 100)))
                                  : formatVnd(Math.max(0, (form.plans_config?.group_2?.price ?? form.price_group) - activePromos.group_2.discount_value))
                                }
                                {'/người'}
                              </span>
                            </div>
                            )}
                            <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">QR Sau Khuyến Mãi</label>
                            {form.qr_group_2_promo ? (
                              <div className="relative group rounded-xl overflow-hidden border border-amber-200 aspect-[2/1] w-full bg-amber-50 flex items-center justify-center">
                                <img src={form.qr_group_2_promo} alt="QR Group 2 KM" className="w-full h-full object-contain p-2" />
                                <button type="button" onClick={() => setForm((f) => ({ ...f, qr_group_2_promo: '' }))}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-xl cursor-pointer bg-amber-50/30 hover:bg-amber-50 transition-all group text-center">
                                <div className="flex flex-col items-center justify-center p-2">
                                  {qrUploading['qr_group_2_promo'] ? (
                                    <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      <span className="text-[11px] font-bold text-amber-600 group-hover:text-amber-700">Tải QR khuyến mãi</span>
                                    </>
                                  )}
                                </div>
                                <input type="file" accept="image/*" disabled={qrUploading['qr_group_2_promo']} className="hidden" onChange={(e) => handleQrUpload('qr_group_2_promo', e)} />
                              </label>
                            )}
                            {qrUploadError?.['qr_group_2_promo'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_group_2_promo']}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Group 4 */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                      <div className="flex flex-col border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-700 font-black">4. Gói Nhóm 4 người</span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {form.plans_config?.group_4?.original_price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              Gốc: {formatVnd(form.plans_config.group_4.original_price * 4)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề hiển thị</label>
                          <input
                            type="text"
                            value={form.plans_config?.group_4?.label ?? ''}
                            placeholder="Mặc định: Nhóm 4 người"
                            onChange={(e) => updatePlanConfig('group_4', 'label', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả phụ</label>
                          <input
                            type="text"
                            value={form.plans_config?.group_4?.sublabel ?? ''}
                            placeholder="Mặc định: 950.000đ/người"
                            onChange={(e) => updatePlanConfig('group_4', 'sublabel', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                        </div>
                        {/* Giá gốc/người — dùng để hiển thị gạch ngang trên UI */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            💰 Giá gốc/người (VNĐ) — hiển thị gạch ngang
                          </label>
                          <input
                            type="number"
                            value={form.plans_config?.group_4?.original_price ?? ''}
                            placeholder={`VD: ${form.price} (giá cá nhân, để gạch ngang)`}
                            onChange={(e) => updatePlanConfig('group_4', 'original_price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-sky-500 transition-all"
                          />
                          {form.plans_config?.group_4?.original_price ? (
                            <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                              → {formatVnd(form.plans_config.group_4.original_price)}/người
                              &nbsp;·&nbsp;Tổng: {formatVnd(form.plans_config.group_4.original_price * 4)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-0.5">Giá trước khi giảm, hiển thị gạch ngang trên form đăng ký</p>
                          )}
                        </div>
                        {/* Giá khuyến mãi/người — giá thực tính tổng */}
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            🏷️ Giá khuyến mãi/người (VNĐ) — giá tính tiền thực
                          </label>
                          <input
                            type="number"
                            value={form.plans_config?.group_4?.price ?? ''}
                            placeholder={`Mặc định: ${form.price_group - 150000}/người`}
                            onChange={(e) => updatePlanConfig('group_4', 'price', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                          />
                          {form.plans_config?.group_4?.price ? (
                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              → {formatVnd(form.plans_config.group_4.price)}/người
                              &nbsp;·&nbsp;Tổng: {formatVnd(form.plans_config.group_4.price * 4)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-0.5">Tổng nhóm 4 người = giá này × 4</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hình ảnh QR chuyển khoản</label>
                          {form.qr_group_4 ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[2/1] w-full bg-white flex items-center justify-center">
                              <img src={form.qr_group_4} alt="QR Group 4" className="w-full h-full object-contain p-2" />
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, qr_group_4: '' }))}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl cursor-pointer bg-white hover:bg-sky-50/10 transition-all group text-center">
                              <div className="flex flex-col items-center justify-center p-2">
                                {qrUploading['qr_group_4'] ? (
                                  <svg className="animate-spin h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-sky-600">Tải ảnh QR</span>
                                  </>
                                )}
                              </div>
                              <input type="file" accept="image/*" disabled={qrUploading['qr_group_4']} className="hidden" onChange={(e) => handleQrUpload('qr_group_4', e)} />
                            </label>
                          )}
                          {qrUploadError?.['qr_group_4'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_group_4']}</p>}
                        </div>

                        {/* QR Khuyến mãi Group 4 — luôn hiện, không phụ thuộc khuyến mãi đang active */}
                        <div className="mt-1 pt-3 border-t border-amber-200">
                            {activePromos.group_4 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase tracking-wide">🎁 Đang có KM</span>
                              <span className="text-[10px] text-amber-600 font-semibold">
                                Giảm {activePromos.group_4.discount_type === 'percent'
                                  ? `${activePromos.group_4.discount_value}%`
                                  : `${activePromos.group_4.discount_value.toLocaleString('vi-VN')}đ`}
                                {' → '}
                                {activePromos.group_4.discount_type === 'percent'
                                  ? formatVnd(Math.round((form.plans_config?.group_4?.price ?? (form.price_group - 150000)) * (1 - activePromos.group_4.discount_value / 100)))
                                  : formatVnd(Math.max(0, (form.plans_config?.group_4?.price ?? (form.price_group - 150000)) - activePromos.group_4.discount_value))
                                }
                                {'/người'}
                              </span>
                            </div>
                            )}
                            <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">QR Sau Khuyến Mãi</label>
                            {form.qr_group_4_promo ? (
                              <div className="relative group rounded-xl overflow-hidden border border-amber-200 aspect-[2/1] w-full bg-amber-50 flex items-center justify-center">
                                <img src={form.qr_group_4_promo} alt="QR Group 4 KM" className="w-full h-full object-contain p-2" />
                                <button type="button" onClick={() => setForm((f) => ({ ...f, qr_group_4_promo: '' }))}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/85 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-xl cursor-pointer bg-amber-50/30 hover:bg-amber-50 transition-all group text-center">
                                <div className="flex flex-col items-center justify-center p-2">
                                  {qrUploading['qr_group_4_promo'] ? (
                                    <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-500 transition-colors mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      <span className="text-[11px] font-bold text-amber-600 group-hover:text-amber-700">Tải QR khuyến mãi</span>
                                    </>
                                  )}
                                </div>
                                <input type="file" accept="image/*" disabled={qrUploading['qr_group_4_promo']} className="hidden" onChange={(e) => handleQrUpload('qr_group_4_promo', e)} />
                              </label>
                            )}
                            {qrUploadError?.['qr_group_4_promo'] && <p className="text-[10px] text-red-500 font-semibold">{qrUploadError['qr_group_4_promo']}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-sm shadow-sm shadow-sky-500/20 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {editingId ? 'Lưu thay đổi' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100/50 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800">Xóa khóa học?</h3>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              Bạn sắp xóa <span className="font-bold text-slate-700">&quot;{deleteTarget.title}&quot;</span>. Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-sm shadow-sm shadow-red-500/20 transition-colors cursor-pointer disabled:opacity-60"
              >
                {deleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
