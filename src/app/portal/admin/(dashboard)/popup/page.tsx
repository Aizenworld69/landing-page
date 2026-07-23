'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getPopupConfigAction, updatePopupConfigAction, uploadPopupImageAction, PopupConfig } from '@/app/actions';
import PromoPopup from '@/components/PromoPopup';
import { apiClient } from '@/lib/portal/api/api-client';
import { PopupDescEditor } from '@/components/portal/admin/PopupDescEditor';

interface CourseOption {
  id: string;
  title: string;
  slug?: string;
}

function formatDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TITLE_COLOR_PALETTE = [
  { name: 'Trắng', value: '#ffffff' },
  { name: 'Vàng Kim', value: '#f59e0b' },
  { name: 'Xanh Ngọc', value: '#10b981' },
  { name: 'Xanh Dương', value: '#3b82f6' },
  { name: 'Đỏ Nổi', value: '#ef4444' },
  { name: 'Tím', value: '#a855f7' },
];

export default function PortalAdminPopupPage() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBgUploading, setIsBgUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    title_color: '#ffffff',
    description: '',
    image_url: '',
    bg_image_url: '',
    cta_text: 'ĐĂNG KÝ NGAY',
    cta_link: '#register',
    countdown_end: '',
    delay_seconds: 0,
    is_active: 1,
  });

  // Load config & courses list
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const pData = await getPopupConfigAction();
        if (pData) {
          setConfig(pData);
          setFormData({
            title: pData.title || '',
            title_color: pData.title_color || '#ffffff',
            description: pData.description || '',
            image_url: pData.image_url || '',
            bg_image_url: pData.bg_image_url || '',
            cta_text: pData.cta_text || 'ĐĂNG KÝ NGAY',
            cta_link: pData.cta_link || '#register',
            countdown_end: formatDateTimeLocal(pData.countdown_end) || formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
            delay_seconds: pData.delay_seconds ?? 0,
            is_active: pData.is_active ?? 1,
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải cấu hình popup:', err);
      } finally {
        setLoading(false);
      }

      // Fetch list of courses for quick link selector
      try {
        const res = await apiClient.get<{ success: boolean; data: { items: CourseOption[] } }>(
          '/portal/courses',
          { params: { limit: 100 } }
        );
        const items = res.data?.data?.items ?? [];
        setCourses(items);
      } catch (err) {
        console.error('Lỗi khi tải danh sách khóa học:', err);
      }
    }

    init();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };


  // Handle Desktop File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await uploadPopupImageAction(uploadData);

      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image_url: res.url }));
        setMessage({ type: 'success', text: 'Tải ảnh từ máy tính lên thành công!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Tải ảnh thất bại.' });
      }
    } catch (err) {
      console.error('Upload image error:', err);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi tải ảnh lên.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload ảnh nền popup
  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBgUploading(true);
    setMessage(null);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await uploadPopupImageAction(uploadData);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, bg_image_url: res.url }));
        setMessage({ type: 'success', text: 'Ảnh nền popup đã tải lên thành công!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Tải ảnh nền thất bại.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi tải ảnh nền.' });
    } finally {
      setIsBgUploading(false);
    }
  };

  const handleRemoveBgImage = () => {
    setFormData((prev) => ({ ...prev, bg_image_url: '' }));
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await updatePopupConfigAction({
        ...formData,
        countdown_end: formData.countdown_end
          ? new Date(formData.countdown_end).toISOString()
          : '',
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Cập nhật cấu hình Popup thành công!' });
        
        // Broadcast signal thời gian thực tới tất cả các tab đang mở
        if (typeof window !== 'undefined') {
          localStorage.setItem('popup_updated_timestamp', String(Date.now()));
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('popup_updates_channel');
            bc.postMessage('popup_updated');
            bc.close();
          }
        }
      } else {
        setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra khi lưu.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi kết nối xảy ra.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium">
        Đang tải cấu hình Popup...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cấu hình Popup & Ưu Đãi Quảng Cáo</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý nội dung, màu sắc chữ, định dạng và đếm ngược hiển thị trên website.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          {message.text}
        </div>
      )}

      {/* Main Grid: Form Inputs + Realtime Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form nhập liệu (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Thông tin cấu hình
            </h2>
            {/* Toggle active status */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active === 1}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-700">
                {formData.is_active === 1 ? 'Đang Bật' : 'Đã Tắt'}
              </span>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Tiêu đề & Chọn màu tiêu đề */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Tiêu đề Popup <span className="text-rose-500">*</span>
                </label>
                {/* Palette chọn màu nhanh cho Tiêu đề */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Màu chữ tiêu đề:</span>
                  {TITLE_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      onClick={() => setFormData((prev) => ({ ...prev, title_color: c.value }))}
                      className={`w-5 h-5 rounded-full border border-slate-300 transition-transform ${
                        formData.title_color === c.value ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.title_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title_color: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 ml-1"
                    title="Tùy chọn màu tùy ý"
                  />
                </div>
              </div>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="VD: ƯU ĐÃI ĐẶC BIỆT THÁNG 7"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Mô tả — WYSIWYG Editor (thấy màu trực tiếp khi soạn) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">
                Mô tả ngắn <span className="text-slate-400 font-normal">(Hỗ trợ màu chữ, in đậm, xuống dòng...)</span>
              </label>
              <PopupDescEditor
                content={formData.description}
                onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
              />
            </div>

            {/* Ảnh nền Popup (Background Image) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Ảnh nền của Popup
                <span className="ml-2 text-[10px] font-normal text-slate-400">(Phủ lên toàn bộ nền card popup)</span>
              </label>

              <input
                type="file"
                ref={bgFileInputRef}
                onChange={handleBgFileChange}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
                id="popup-bg-file-input"
              />

              {formData.bg_image_url ? (
                <div
                  className="relative rounded-2xl overflow-hidden border border-slate-200 h-24 flex items-end justify-between p-2.5"
                  style={{ backgroundImage: `url(${formData.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-slate-900/40" />
                  <p className="relative text-[11px] font-bold text-white truncate max-w-[60%] drop-shadow">
                    {formData.bg_image_url.split('/').pop()}
                  </p>
                  <div className="relative flex gap-2">
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-[11px] font-bold backdrop-blur-sm hover:bg-white/30 transition border border-white/30"
                    >
                      Đổi
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveBgImage}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/80 text-white text-[11px] font-bold backdrop-blur-sm hover:bg-rose-600 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="popup-bg-file-input"
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-violet-50/50 hover:bg-violet-50 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-bold text-violet-700 text-xs">
                    {isBgUploading ? '⏳ Đang tải ảnh nền...' : 'Bấm để chọn ảnh nền popup'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP · Tối đa 5MB</p>
                </label>
              )}
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Hình ảnh Banner Popup (Tải từ máy tính)
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
                id="popup-file-input"
              />

              {formData.image_url ? (
                <div className="relative p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="Banner Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                    />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {formData.image_url.split('/').pop() || 'Ảnh Popup đã chọn'}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                        <span>✓</span> Đã tải ảnh lên thành công
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition cursor-pointer text-xs"
                    >
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition cursor-pointer text-xs"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="popup-file-input"
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/40 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="font-bold text-slate-700 text-xs">
                    {isUploading ? '⏳ Đang tải ảnh lên...' : 'Bấm để chọn ảnh từ máy tính (Desktop)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng PNG, JPG, WEBP, GIF (Tối đa 5MB)
                  </p>
                </label>
              )}
            </div>

            {/* Chữ trên nút & Link khóa học */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chữ trên nút (CTA Text)
                </label>
                <input
                  type="text"
                  name="cta_text"
                  value={formData.cta_text}
                  onChange={handleChange}
                  placeholder="VD: ĐĂNG KÝ NGAY"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đích đến khi bấm nút (Trang Khóa học / URL)
                </label>
                <input
                  type="text"
                  name="cta_link"
                  value={formData.cta_link}
                  onChange={handleChange}
                  placeholder="VD: /portal/courses/ai-mastery hoặc #register"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Chọn nhanh Khóa học gợi ý */}
            {courses.length > 0 && (
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <label className="block text-[11px] font-bold text-indigo-900 mb-1.5">
                  👉 Chọn nhanh khóa học để làm link đích đến khi click nút:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData((prev) => ({ ...prev, cta_link: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn khóa học để điền link tự động --</option>
                  <option value="#register">Mặc định (Cuộn đến Form đăng ký trang chủ)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={`/portal/courses/${c.slug || c.id}`}>
                      {c.title} (/portal/courses/{c.slug || c.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ngày đếm ngược & Delay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Thời gian kết thúc đếm ngược
                </label>
                <input
                  type="datetime-local"
                  name="countdown_end"
                  value={formData.countdown_end}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Độ trễ hiển thị (Giây)
                </label>
                <input
                  type="number"
                  name="delay_seconds"
                  min={0}
                  max={60}
                  value={formData.delay_seconds}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Button Save */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <span>💾</span>
                {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình Popup'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview (5 cột) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-950 p-5 rounded-2xl shadow-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-slate-400 ml-2">Live Preview (Xem Trước)</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Realtime
              </span>
            </div>

            <div className="py-2">
              <PromoPopup isPreview={true} previewConfig={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
