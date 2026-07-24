'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function VerticalThreeSectionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Live Countdown Timer State cho Khung 3 (Early Bird)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);
    setIsOpen(true);
  }, []);

  // Countdown timer logic (Mục tiêu: Hết ngày 01/08/2026)
  useEffect(() => {
    if (!isOpen) return;

    const targetDate = new Date('2026-08-01T23:59:59+07:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Box Container - Fit-to-screen Compact Layout */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[460px] sm:max-w-[500px] bg-slate-950/40 border border-slate-700/80 shadow-2xl overflow-hidden text-white flex flex-col z-10 my-auto rounded-3xl sm:rounded-[32px]"
          >
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/backgoundTrangkhoahoc.jpg"
                alt="Popup Background"
                fill
                className="object-cover object-center opacity-85 scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/30 to-slate-950/50 backdrop-blur-[1px]" />
            </div>

            {/* Header / Close button */}
            <div className="relative z-10 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Glowing Ping Dot Effect */}
                <div className="relative flex items-center justify-center w-3 h-3">
                  <span className="absolute w-3.5 h-3.5 rounded-full bg-amber-400/80 animate-ping" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md shadow-amber-400/60" />
                </div>

                {/* Animated Gold Gradient Text */}
                <motion.h3
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-xs sm:text-base font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)] animate-pulse"
                >
                  Chương Trình Khóa Học & Ưu Đãi
                </motion.h3>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60 touch-manipulation active:scale-90"
                aria-label="Đóng popup"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="relative z-10 p-3 sm:p-4 space-y-3 sm:space-y-3.5">

              {/* ================= KHUNG 1: AI SALE & MARKETING FULLSTACK (TO & NỔI BẬT) ================= */}
              <div className="bg-slate-950/90 border border-slate-800 hover:border-sky-400/60 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex gap-3.5 sm:gap-4 items-center transition-all group shadow-md">
                {/* Thumbnail Image Left - Ultra Large Poster Size */}
                <div className="relative w-44 sm:w-56 h-28 sm:h-34 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                  <Image
                    src="/fullstack.jpg"
                    alt="AI Sale Marketing Fullstack"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                    sizes="250px"
                  />
                </div>

                {/* Info Right - Clean Right Alignment */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-1.5 sm:gap-2 text-right items-end">
                  <span className="text-slate-300 text-[11px] font-bold">
                    📅 22-23/08/2026
                  </span>

                  <h4 className="font-black text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors leading-snug">
                    AI SALE & MARKETING FULLSTACK
                  </h4>

                  <Link
                    href="/portal/courses/aisalemarkertingfullstack"
                    onClick={handleClose}
                    className="w-fit mt-0.5"
                  >
                    <button className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer uppercase tracking-wider touch-manipulation whitespace-nowrap">
                      Đăng ký ngay
                    </button>
                  </Link>
                </div>
              </div>

              {/* ================= KHUNG 2: LÀM CHỦ CLAUDE AI (KHÓA 3) (TO & NỔI BẬT) ================= */}
              <div className="bg-slate-950/90 border border-slate-800 hover:border-amber-400/60 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex gap-3.5 sm:gap-4 items-center transition-all group shadow-md">
                {/* Thumbnail Image Left - Ultra Large Poster Size */}
                <div className="relative w-44 sm:w-56 h-28 sm:h-34 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                  <Image
                    src="/khoa3.jpg"
                    alt="Làm chủ Claude AI khóa 3"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                    sizes="250px"
                  />
                </div>

                {/* Info Right - Clean Right Alignment */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-1.5 sm:gap-2 text-right items-end">
                  <span className="text-slate-300 text-[11px] font-bold">
                    📅 05/09/2026
                  </span>

                  <h4 className="font-black text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors leading-snug">
                    LÀM CHỦ CLAUDE AI (KHÓA 3)
                  </h4>

                  <Link
                    href="/portal/courses/lam-chu-claude-ai-khoa-3"
                    onClick={handleClose}
                    className="w-fit mt-0.5"
                  >
                    <button className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer uppercase tracking-wider touch-manipulation whitespace-nowrap">
                      Đăng ký ngay
                    </button>
                  </Link>
                </div>
              </div>

              {/* ================= KHUNG 3: EARLY BIRD (ÔM KHÍT CHIỀU NGANG) ================= */}
              <div className="bg-gradient-to-br from-amber-950/80 via-slate-950 to-orange-950/80 border border-amber-500/40 rounded-xl p-2 sm:p-2.5 flex flex-col gap-1.5 shadow-md relative overflow-hidden max-w-[260px] sm:max-w-[280px] mx-auto w-full">
                {/* Badge Early Bird - Chữ to, không có khung nhỏ */}
                <div className="flex items-center justify-center pt-0.5">
                  <span className="text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider animate-pulse drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
                    🔥 ƯU ĐÃI EARLY BIRD
                  </span>
                </div>

                {/* Đồng hồ đếm ngược thời gian thực - Ôm khít 100% chiều ngang khung */}
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-1.5 text-center w-full shadow-inner">
                  <p className="text-[8px] sm:text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1">
                    ⏳ CHỈ CÒN {timeLeft.days} NGÀY
                  </p>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                      <span className="block text-xs sm:text-sm font-black text-amber-400 leading-none">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">Ngày</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                      <span className="block text-xs sm:text-sm font-black text-amber-400 leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">Giờ</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                      <span className="block text-xs sm:text-sm font-black text-amber-400 leading-none">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">Phút</span>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-1">
                      <span className="block text-xs sm:text-sm font-black text-amber-400 animate-pulse leading-none">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase">Giây</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
