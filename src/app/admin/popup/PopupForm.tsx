'use client';

import React, { useState, useRef } from 'react';
import { updatePopupConfigAction, uploadPopupImageAction, PopupConfig } from '@/app/actions';
import PromoPopup from '@/components/PromoPopup';
import { compressImage } from '@/lib/image-compression';

interface PopupFormProps {
  initialConfig: PopupConfig;
}

const TITLE_COLOR_PALETTE = [
  { name: 'Trắng', value: '#ffffff' },
  { name: 'Vàng Kim', value: '#f59e0b' },
  { name: 'Xanh Ngọc', value: '#10b981' },
  { name: 'Xanh Dương', value: '#3b82f6' },
  { name: 'Đỏ Nổi', value: '#ef4444' },
  { name: 'Tím', value: '#a855f7' },
];

function formatDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PopupForm({ initialConfig }: PopupFormProps) {
  const [formData, setFormData] = useState({
    title: initialConfig?.title || '',
    title_color: initialConfig?.title_color || '#ffffff',
    description: initialConfig?.description || '',
    image_url: initialConfig?.image_url || '',
    bg_image_url: initialConfig?.bg_image_url || '',
    cta_text: initialConfig?.cta_text || 'ĐĂNG KÝ NGAY',
    cta_link: initialConfig?.cta_link || '#register',
    countdown_end: formatDateTimeLocal(initialConfig?.countdown_end) || formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    delay_seconds: initialConfig?.delay_seconds ?? 3,
    is_active: initialConfig?.is_active ?? 1,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const applyDescFormatting = (startTag: string, endTag: string = '') => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = formData.description;

    const selectedText = currentVal.substring(start, end);
    const replacement = selectedText
      ? `${startTag}${selectedText}${endTag}`
      : `${startTag}${endTag}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    setFormData((prev) => ({ ...prev, description: newVal }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + startTag.length,
        start + startTag.length + selectedText.length
      );
    }, 50);
  };

  const applyDescColor = (colorHex: string) => {
    applyDescFormatting(`<span style="color: ${colorHex};">`, '</span>');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const compressed = await compressImage(file);
      const uploadData = new FormData();
      uploadData.append('file', compressed);

      const res = await uploadPopupImageAction(uploadData);

      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image_url: res.url }));
        setMessage({ type: 'success', text: 'Tải ảnh từ máy tính lên thành công!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Tải ảnh thất bại.' });
      }
    } catch (err) {
      console.error('Upload error:', err);
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

  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBg(true);
    setMessage(null);

    try {
      const compressed = await compressImage(file);
      const uploadData = new FormData();
      uploadData.append('file', compressed);

      const res = await uploadPopupImageAction(uploadData);

      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, bg_image_url: res.url }));
        setMessage({ type: 'success', text: 'Tải ảnh nền từ máy tính lên thành công!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Tải ảnh nền thất bại.' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi tải ảnh nền lên.' });
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleRemoveBgImage = () => {
    setFormData((prev) => ({ ...prev, bg_image_url: '' }));
    if (bgFileInputRef.current) {
      bgFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const res = await updatePopupConfigAction({
      ...formData,
      countdown_end: formData.countdown_end
        ? new Date(formData.countdown_end).toISOString()
        : '',
    });

    setIsSaving(false);
    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'Cập nhật thành công!' });
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Cấu Hình - Cột Trái (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Cấu hình Popup Quảng cáo</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thay đổi thông tin, màu sắc chữ và đếm ngược hiển thị trên website.
            </p>
          </div>
          {/* Toggle Active */}
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active === 1}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700">
              {formData.is_active === 1 ? 'Đang Bật' : 'Đã Tắt'}
            </span>
          </label>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tiêu đề & Chọn màu tiêu đề */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tiêu đề Popup <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Màu chữ tiêu đề:</span>
                {TITLE_COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    onClick={() => setFormData((prev) => ({ ...prev, title_color: c.value }))}
                    className={`w-5 h-5 rounded-full border border-slate-300 transition-transform ${
                      formData.title_color === c.value ? 'scale-125 ring-2 ring-[#1a7a5e] ring-offset-1' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.title_color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title_color: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0 ml-1"
                  title="Tùy chọn màu"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30 focus:border-[#1a7a5e]"
            />
          </div>

          {/* Mô tả & Công cụ định dạng Rich Text */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mô tả chi tiết (Tùy chỉnh màu chữ, xuống dòng, bôi đậm...)
            </label>

            {/* Toolbar */}
            <div className="p-2 bg-slate-100/80 rounded-t-xl border border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Định dạng:</span>
              <button
                type="button"
                onClick={() => applyDescFormatting('<strong>', '</strong>')}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 font-black text-slate-800"
                title="In đậm"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => applyDescFormatting('<em>', '</em>')}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 italic font-semibold text-slate-800"
                title="In nghiêng"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => applyDescFormatting('<mark class="bg-amber-300 text-slate-900 px-1 rounded">', '</mark>')}
                className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-bold border border-amber-300"
                title="Bôi nổi"
              >
                ✨ Nổi bật
              </button>
              <button
                type="button"
                onClick={() => applyDescFormatting('<br />')}
                className="px-2 py-1 bg-white hover:bg-slate-200 rounded border border-slate-300 font-semibold text-slate-700"
                title="Xuống dòng"
              >
                ↵ Xuống dòng
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1" />
              <span className="text-[10px] font-medium text-slate-500">Màu chữ:</span>
              <button
                type="button"
                onClick={() => applyDescColor('#fbbf24')}
                className="w-4 h-4 rounded-full bg-amber-400 border border-slate-300 hover:scale-110"
              />
              <button
                type="button"
                onClick={() => applyDescColor('#34d399')}
                className="w-4 h-4 rounded-full bg-emerald-400 border border-slate-300 hover:scale-110"
              />
              <button
                type="button"
                onClick={() => applyDescColor('#60a5fa')}
                className="w-4 h-4 rounded-full bg-blue-400 border border-slate-300 hover:scale-110"
              />
              <button
                type="button"
                onClick={() => applyDescColor('#f87171')}
                className="w-4 h-4 rounded-full bg-rose-400 border border-slate-300 hover:scale-110"
              />
              <input
                type="color"
                onChange={(e) => applyDescColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 ml-1"
                title="Chọn màu tự chọn"
              />
            </div>

            <textarea
              ref={descTextareaRef}
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập nội dung mô tả... Nhấn Enter để xuống dòng."
              className="w-full px-4 py-2.5 rounded-b-xl border border-slate-300 border-t-0 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30 focus:border-[#1a7a5e] font-mono leading-relaxed"
            />
          </div>

          {/* Tải ảnh từ máy tính (Desktop File Upload) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hình ảnh Banner Popup (Tải từ máy tính)
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
              id="admin-file-input"
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
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition cursor-pointer text-xs"
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
                htmlFor="admin-file-input"
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#1a7a5e] bg-slate-50/70 hover:bg-[#1a7a5e]/5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a7a5e]/10 text-[#1a7a5e] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
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

          {/* Tải ảnh nền từ máy tính (Background Image File Upload) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hình ảnh Nền Popup (Tải từ máy tính)
            </label>
            
            <input
              type="file"
              ref={bgFileInputRef}
              onChange={handleBgFileChange}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
              id="admin-bg-file-input"
            />

            {formData.bg_image_url ? (
              <div className="relative p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={formData.bg_image_url}
                    alt="Background Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="truncate">
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {formData.bg_image_url.split('/').pop() || 'Ảnh Nền đã chọn'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <span>✓</span> Đã tải ảnh lên thành công
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => bgFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition cursor-pointer text-xs"
                  >
                    Đổi ảnh
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBgImage}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition cursor-pointer text-xs"
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="admin-bg-file-input"
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#1a7a5e] bg-slate-50/70 hover:bg-[#1a7a5e]/5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a7a5e]/10 text-[#1a7a5e] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <p className="font-bold text-slate-700 text-xs">
                  {isUploadingBg ? '⏳ Đang tải ảnh lên...' : 'Bấm để chọn ảnh nền từ máy tính (Desktop)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hỗ trợ định dạng PNG, JPG, WEBP, GIF (Tối đa 5MB)
                </p>
              </label>
            )}
          </div>

          {/* Cặp Nút bấm CTA: Chữ nút & Đường dẫn Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chữ trên nút (CTA)
              </label>
              <input
                type="text"
                name="cta_text"
                value={formData.cta_text}
                onChange={handleChange}
                placeholder="VD: ĐĂNG KÝ NGAY"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30 focus:border-[#1a7a5e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Đích đến khi bấm nút (URL / Link)
              </label>
              <input
                type="text"
                name="cta_link"
                value={formData.cta_link}
                onChange={handleChange}
                placeholder="VD: /portal/courses hoặc #register"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30 focus:border-[#1a7a5e]"
              />
            </div>
          </div>

          {/* Ngày đếm ngược & Thời gian Delay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Thời gian kết thúc đếm ngược
              </label>
              <input
                type="datetime-local"
                name="countdown_end"
                value={formData.countdown_end}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30 focus:border-[#1a7a5e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Độ trễ hiển thị (Giây)
              </label>
              <input
                type="number"
                name="delay_seconds"
                min={0}
                max={60}
                value={formData.delay_seconds}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30 focus:border-[#1a7a5e]"
              />
            </div>
          </div>

          {/* Nút lưu */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#1a7a5e] text-white font-bold text-sm shadow-md hover:bg-[#15634c] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              {isSaving ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình Popup'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview - Cột Phải (5 cols) */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="bg-slate-950 p-6 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-400 ml-2">Live Preview (Xem Trực Tiếp)</span>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Realtime
            </span>
          </div>

          <div className="py-2">
            <PromoPopup isPreview={true} previewConfig={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}
