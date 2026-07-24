'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getPopupConfigAction, PopupConfig } from '@/app/actions';

// Sanitize HTML thuần JS — chặn XSS mà không cần thư viện ngoài
const ALLOWED_TAGS = new Set(['strong', 'em', 'span', 'br', 'mark', 'p', 'b', 'i', 'u']);
const ALLOWED_ATTRS = new Set(['style', 'class']);

function sanitizeHtml(dirty: string): string {
  if (typeof document === 'undefined') return dirty;
  const doc = new DOMParser().parseFromString(dirty, 'text/html');
  function walk(node: Element) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          // Thay thế tag không hợp lệ bằng nội dung bên trong
          el.replaceWith(...Array.from(el.childNodes));
        } else {
          // Xóa attributes không nằm trong whitelist
          Array.from(el.attributes).forEach((attr) => {
            if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
              el.removeAttribute(attr.name);
            }
          });
          walk(el);
        }
      }
    });
  }
  walk(doc.body);
  return doc.body.innerHTML;
}

interface PromoPopupProps {
  initialConfig?: PopupConfig | null;
  isPreview?: boolean;
  previewConfig?: Partial<PopupConfig>;
}

export default function PromoPopup({
  initialConfig,
  isPreview = false,
  previewConfig,
}: PromoPopupProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [config, setConfig] = useState<PopupConfig | null>(initialConfig || null);
  const [isOpen, setIsOpen] = useState<boolean>(isPreview);

  const [imageError, setImageError] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  // Đảm bảo client mount trước khi đọc localStorage để chống Hydration Mismatch
  useEffect(() => {
    setIsMounted(true);
    if (!initialConfig) {
      try {
        const cached = localStorage.getItem('aizen_cached_popup_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          setConfig(parsed);
          if (parsed.is_active === 1) {
            setIsOpen(true);
          }
        }
      } catch (_) {}
    }
  }, [initialConfig]);

  // Merge live config when in preview mode
  const activeConfig: Partial<PopupConfig> = isPreview
    ? { ...config, ...previewConfig }
    : config || {};

  const imageUrl = activeConfig.image_url;

  // Reset image error state when image_url changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Fetch popup config và setup Realtime Sync (không polling — dùng BroadcastChannel)
  useEffect(() => {
    if (isPreview) {
      setIsOpen(true);
      return;
    }

    // Dùng tên khác để tránh shadow với isMounted state ở trên
    let isSubscribed = true;
    let timer: NodeJS.Timeout | null = null;

    async function loadConfig() {
      const data = await getPopupConfigAction();
      if (!isSubscribed) return;

      if (data && data.is_active === 1) {
        setConfig(data);
        try {
          localStorage.setItem('aizen_cached_popup_config', JSON.stringify(data));
        } catch (_) {}

        const delay = (data.delay_seconds ?? 0) * 1000;
        if (delay <= 100) {
          setIsOpen(true);
        } else {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            if (isSubscribed) setIsOpen(true);
          }, delay);
        }
      } else if (data && data.is_active === 0) {
        setIsOpen(false);
      }
    }

    loadConfig();

    // Sync realtime qua BroadcastChannel (cùng trình duyệt, khác tab)
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('popup_updates_channel');
      bc.onmessage = (event) => {
        if (event.data === 'popup_updated') {
          loadConfig();
        }
      };
    }

    // Sync realtime qua Storage event (cùng trình duyệt, khác tab — fallback)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'popup_updated_timestamp') {
        loadConfig();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      isSubscribed = false;
      if (timer) clearTimeout(timer);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [isPreview]);

  // Countdown timer logic
  useEffect(() => {
    const targetStr = activeConfig.countdown_end;
    if (!targetStr || typeof targetStr !== 'string') return;

    function calculateTimeLeft() {
      const targetDate = new Date(targetStr!).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    }

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [activeConfig.countdown_end]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCtaClick = () => {
    handleClose();
    const link = activeConfig.cta_link || '#register';
    if (link.startsWith('#')) {
      const el = document.querySelector(link);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/' + link);
      }
    } else {
      router.push(link);
    }
  };

  const title = activeConfig.title || 'ƯU ĐÃI ĐẶC BIỆT KHÓA HỌC';
  const description =
    activeConfig.description ||
    'Đăng ký ngay hôm nay để nhận ngay voucher ưu đãi 20% học phí!';
  const sanitizedDescription = useMemo(() => sanitizeHtml(description), [description]);
  const ctaText = activeConfig.cta_text || 'ĐĂNG KÝ NGAY';

  const titleColor = activeConfig.title_color || '#ffffff';
  const timerColor = activeConfig.timer_color || '#34d399';
  const ctaBgColor = activeConfig.cta_bg_color || '#059669';
  const ctaTextColor = activeConfig.cta_text_color || '#ffffff';

  if (!isPreview && (!isMounted || !config || config.is_active !== 1)) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`${
            isPreview ? 'relative w-full' : 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6'
          }`}
        >
          {/* Backdrop overlay */}
          {!isPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />
          )}

          {/* Modal Container */}
          <motion.div
            initial={isPreview ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl text-white shadow-2xl border border-slate-700/60 z-10"
            style={activeConfig.bg_image_url ? {
              backgroundImage: `url(${activeConfig.bg_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : { backgroundColor: '#0f172a' /* slate-900 */ }}
          >
            {/* Overlay nhẹ tăng tương phản chữ khi có ảnh nền — đủ thấy ảnh */}
            {activeConfig.bg_image_url && (
              <div className="absolute inset-0 bg-slate-900/25" />
            )}

            {/* Background Glow Effects — chỉ hiện khi không có ảnh nền */}
            {!activeConfig.bg_image_url && (
              <>
                <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
              </>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white border border-slate-600/40"
              aria-label="Đóng popup"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image (if available & valid) */}
            {imageUrl && !imageError && (
              <div className="relative w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={title}
                  onError={() => setImageError(true)}
                  className="w-full h-auto max-h-[380px] object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}

            {/* Body Content */}
            <div className="p-6 sm:p-8 relative z-10">
              {/* Badge */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>CHƯƠNG TRÌNH ĐẶC BIỆT</span>
              </div>

              {/* Title */}
              <h3
                className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug"
                style={{ color: titleColor }}
              >
                {title}
              </h3>

              {/* Description — sanitize trước khi render để chặn XSS */}
              <div
                className="mt-2.5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap [&_p]:my-1 [&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />

              {/* Countdown Timer */}
              {activeConfig.countdown_end && (
                timeLeft.expired ? (
                  <div className="mt-5 rounded-2xl bg-amber-500/10 p-3.5 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <span className="animate-bounce">🔥</span>
                    <span>Chương trình ưu đãi sắp diễn ra! Hãy đăng ký ngay để không bỏ lỡ.</span>
                  </div>
                ) : (
                  <div className={`mt-6 rounded-2xl p-4 border backdrop-blur-sm ${activeConfig.bg_image_url ? 'bg-black/30 border-white/10' : 'bg-slate-800/80 border-slate-700/60'}`}>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                      ⏰ Thời gian ưu đãi còn lại
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className={`rounded-xl p-2.5 border ${activeConfig.bg_image_url ? 'bg-black/30 border-white/10' : 'bg-slate-900/90 border-slate-700/50'}`}>
                        <span className="block text-xl sm:text-2xl font-black" style={{ color: timerColor }}>
                          {String(timeLeft.days).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Ngày</span>
                      </div>
                      <div className={`rounded-xl p-2.5 border ${activeConfig.bg_image_url ? 'bg-black/30 border-white/10' : 'bg-slate-900/90 border-slate-700/50'}`}>
                        <span className="block text-xl sm:text-2xl font-black" style={{ color: timerColor }}>
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Giờ</span>
                      </div>
                      <div className={`rounded-xl p-2.5 border ${activeConfig.bg_image_url ? 'bg-black/30 border-white/10' : 'bg-slate-900/90 border-slate-700/50'}`}>
                        <span className="block text-xl sm:text-2xl font-black" style={{ color: timerColor }}>
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Phút</span>
                      </div>
                      <div className={`rounded-xl p-2.5 border ${activeConfig.bg_image_url ? 'bg-black/30 border-white/10' : 'bg-slate-900/90 border-slate-700/50'}`}>
                        <span className="block text-xl sm:text-2xl font-black" style={{ color: timerColor }}>
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Giây</span>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Action Buttons */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleCtaClick}
                  style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                  className="w-full flex-1 rounded-xl px-5 py-3.5 text-center text-sm font-bold shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  {ctaText}
                </button>
                <button
                  onClick={handleClose}
                  className={`w-full sm:w-auto rounded-xl px-4 py-3.5 text-center text-sm font-semibold transition-all ${activeConfig.bg_image_url ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  Để sau
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
