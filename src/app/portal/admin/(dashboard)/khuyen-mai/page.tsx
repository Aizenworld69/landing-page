"use client";

import { useEffect, useState, useCallback } from "react";
import {
  adminGetPromoCodes,
  adminCreatePromoCode,
  adminUpdatePromoCode,
  adminDeletePromoCode,
  type PromoCode,
  type CreatePromoCodePayload,
  type PaginatedPromoCodes,
} from "@/lib/portal/api/admin-promo-codes.api";
import { apiClient } from "@/lib/portal/api/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseOption {
  id: string;
  title: string;
}

const PLAN_LABEL: Record<string, string> = {
  early_bird: "Early Bird",
  individual: "Cá nhân",
  group_2: "Nhóm 2 người",
  group_4: "Nhóm 4 người",
  all: "Tất cả",
};

const DISCOUNT_TYPE_LABEL: Record<string, string> = {
  percent: "Phần trăm (%)",
  fixed: "Cố định (VNĐ)",
};

const EMPTY_FORM: CreatePromoCodePayload = {
  code: "",
  course_id: "",
  plan: "all",
  discount_type: "percent",
  discount_value: 10,
  max_uses: 100,
  expires_at: "",
  note: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDiscount(promo: PromoCode): string {
  if (promo.discount_type === "percent") return `${promo.discount_value}%`;
  return promo.discount_value.toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatDateTimeLocal(isoString: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function adminAuthHeader() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_access_token")
      : null;
  return { Authorization: `Bearer ${token ?? ""}` };
}

// ─── Modal Form ───────────────────────────────────────────────────────────────

interface ModalFormProps {
  initial: CreatePromoCodePayload;
  courses: CourseOption[];
  isEdit: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: CreatePromoCodePayload) => Promise<void>;
}

function ModalForm({ initial, courses, isEdit, saving, onClose, onSubmit }: ModalFormProps) {
  const [form, setForm] = useState<CreatePromoCodePayload>(initial);

  function set<K extends keyof CreatePromoCodePayload>(
    key: K,
    value: CreatePromoCodePayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {isEdit ? "Chỉnh sửa mã khuyến mãi" : "Tạo mã khuyến mãi mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Code */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Mã khuyến mãi <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="VD: AIZEN50"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono uppercase tracking-wider"
              />
              <p className="text-xs text-slate-400 mt-1">Chỉ dùng chữ hoa, số, gạch dưới, gạch ngang</p>
            </div>
          )}

          {/* Course */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Khóa học <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.course_id}
              onChange={(e) => set("course_id", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Gói áp dụng</label>
            <div className="flex gap-2">
              {(["all", "early_bird", "individual", "group_2", "group_4"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("plan", p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                    form.plan === p
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  {PLAN_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Loại giảm giá</label>
              <select
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value as "percent" | "fixed")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Giá trị giảm{" "}
                <span className="text-slate-400">
                  ({form.discount_type === "percent" ? "%" : "VNĐ"})
                </span>
              </label>
              <input
                required
                type="number"
                min={1}
                value={form.discount_value}
                onChange={(e) => set("discount_value", Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Max uses */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Giới hạn lượt dùng <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min={1}
              value={form.max_uses}
              onChange={(e) => set("max_uses", Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Expires */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Ngày hết hạn{" "}
              <span className="text-slate-400">(để trống = không hết hạn)</span>
            </label>
            <input
              type="datetime-local"
              value={form.expires_at ?? ""}
              onChange={(e) => set("expires_at", e.target.value || undefined)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú nội bộ</label>
            <textarea
              rows={2}
              value={form.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Marketing campaign Q3 2025, v.v."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo mã"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPromoCodesPage() {
  const [result, setResult] = useState<PaginatedPromoCodes | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load data ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetPromoCodes({ page, limit: 20 });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // GET /courses -> ApiResponse<PaginatedResponse<Course>>
    // shape: { success, data: { items: Course[], pagination } }
    apiClient
      .get<{ success: boolean; data: { items: CourseOption[] } }>("/portal/courses", {
        params: { limit: 100 },
        headers: adminAuthHeader(),
      })
      .then(({ data }) => {
        const items = data?.data?.items ?? [];
        setCourses(items.map((c) => ({ id: c.id, title: c.title })));
      })
      .catch(() => setCourses([]));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setError(null);
    setShowModal(true);
  }

  function openEdit(promo: PromoCode) {
    setEditTarget(promo);
    setError(null);
    setShowModal(true);
  }

  async function handleSubmit(form: CreatePromoCodePayload) {
    setSaving(true);
    setError(null);
    try {
      if (!form.course_id || form.course_id.trim() === "") {
        throw new Error("Vui lòng chọn khóa học");
      }

      // Chấp nhận mọi UUID format (8-4-4-4-12 hex), không giới hạn version
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(form.course_id)) {
        throw new Error("Khóa học được chọn không hợp lệ");
      }

      const expiresAtDate = form.expires_at ? new Date(form.expires_at) : null;
      if (expiresAtDate) {
        if (
          isNaN(expiresAtDate.getTime()) ||
          expiresAtDate.getFullYear() > 9999 ||
          expiresAtDate.getFullYear() < 1000
        ) {
          throw new Error("Ngày hết hạn không hợp lệ (năm phải từ 1000 đến 9999)");
        }
      }

      const cleanPayload: CreatePromoCodePayload = {
        ...form,
        expires_at: expiresAtDate ? expiresAtDate.toISOString() : undefined,
        note: form.note || undefined,
      };

      // Remove undefined fields to avoid sending them
      const finalPayload = Object.fromEntries(
        Object.entries(cleanPayload).filter(([_, v]) => v !== undefined)
      ) as CreatePromoCodePayload;

      console.log("[PromoCode] Payload gửi lên backend:", JSON.stringify(finalPayload, null, 2));

      if (editTarget) {
        const { code: _code, ...updatePayload } = finalPayload;
        await adminUpdatePromoCode(editTarget.id, updatePayload);
      } else {
        await adminCreatePromoCode(finalPayload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      console.error("[PromoCode] Lỗi submit:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(promo: PromoCode) {
    try {
      await adminUpdatePromoCode(promo.id, { is_active: !promo.is_active });
      load();
    } catch {
      alert("Cập nhật thất bại");
    }
  }

  async function handleDelete(promo: PromoCode) {
    if (!confirm(`Xóa mã "${promo.code}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await adminDeletePromoCode(promo.id);
      load();
    } catch {
      alert("Xóa thất bại");
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  const initialForm: CreatePromoCodePayload = editTarget
    ? {
        code: editTarget.code,
        course_id: editTarget.course_id,
        plan: editTarget.plan,
        discount_type: editTarget.discount_type,
        discount_value: editTarget.discount_value,
        max_uses: editTarget.max_uses,
        expires_at: formatDateTimeLocal(editTarget.expires_at),
        note: editTarget.note ?? "",
      }
    : EMPTY_FORM;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mã khuyến mãi</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý mã giảm giá cho các khóa học
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mã mới
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Đang tải...</div>
        ) : !result || result.data.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 text-sm">Chưa có mã khuyến mãi nào.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
            >
              Tạo mã đầu tiên →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Mã</th>
                  <th className="px-4 py-3 text-left font-medium">Khóa học</th>
                  <th className="px-4 py-3 text-left font-medium">Gói</th>
                  <th className="px-4 py-3 text-left font-medium">Giảm giá</th>
                  <th className="px-4 py-3 text-left font-medium">Lượt dùng</th>
                  <th className="px-4 py-3 text-left font-medium">Hết hạn</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.data.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50 transition">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs tracking-wider">
                        {promo.code}
                      </span>
                    </td>

                    {/* Course */}
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">
                      {promo.courses?.title ?? (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {PLAN_LABEL[promo.plan] ?? promo.plan}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3 font-medium text-emerald-700">
                      {formatDiscount(promo)}
                      <span className="text-xs text-slate-400 ml-1">
                        ({promo.discount_type === "percent" ? "%" : "cố định"})
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                (promo.used_count / promo.max_uses) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {promo.used_count}/{promo.max_uses}
                        </span>
                      </div>
                    </td>

                    {/* Expires */}
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDate(promo.expires_at)}
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(promo)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          promo.is_active ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                        title={promo.is_active ? "Đang kích hoạt" : "Đã tắt"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            promo.is_active ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(promo)}
                          className="text-slate-400 hover:text-indigo-600 transition"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          className="text-slate-400 hover:text-red-500 transition"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">
            Tổng {result.total} mã • Trang {result.page}/{result.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              ← Trước
            </button>
            <button
              disabled={page >= result.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ModalForm
          initial={initialForm}
          courses={courses}
          isEdit={!!editTarget}
          saving={saving}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
