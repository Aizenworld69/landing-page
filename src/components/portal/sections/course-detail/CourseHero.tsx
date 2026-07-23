'use client';

import { motion } from 'framer-motion';
import type { CourseWithDetails } from '@aizen/types';

interface CourseHeroProps {
  course: CourseWithDetails;
}

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatWeekdayDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weekday = weekdays[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');

  return `${weekday}, ${day}/${month}`;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

export function CourseHero({ course }: CourseHeroProps) {
  const date = formatDate(course.start_date);
  const formattedWeekdayDate = formatWeekdayDate(course.start_date);
  const isCompleted = course.status === 'completed';

  return (
    <section className="relative pt-6 pb-12 text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0EA5E9]/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-12 right-0 w-72 h-72 rounded-full bg-[#3b82f6]/8 blur-[80px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Top Tagline (Matching Image 1) */}
        <motion.div variants={fadeUp} className="mb-4">
          <span className="text-xs sm:text-sm font-black tracking-[0.2em] text-[#38bdf8] uppercase">
            KHÓA HỌC TỪ CƠ BẢN ĐẾN CHUYÊN SÂU
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-4"
        >
          {course.title.split(' ').map((word, i) => {
            const isOrange = ['Claude', 'AI', 'Automation'].some(k => word.includes(k));
            return isOrange ? (
              <span key={i} className="text-[#ea580c]">
                {word}{' '}
              </span>
            ) : (
              <span key={i}>{word} </span>
            );
          })}
        </motion.h1>

        {/* Description (Italic matching Image 1) */}
        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg text-slate-300 italic font-medium leading-[1.6] mb-6 max-w-xl mx-auto"
        >
          {course.description}
        </motion.p>

        {/* Date + Time + Location Sub-bar (Matching Image 1 Exact Layout) */}
        {(formattedWeekdayDate || course.location) && (
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap mb-8 text-left"
          >
            {/* Date & Time Column */}
            {formattedWeekdayDate && (
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-500 text-2xl shrink-0">calendar_month</span>
                <div className="flex flex-col">
                  <span className="text-white font-black text-sm sm:text-base leading-tight">
                    {formattedWeekdayDate}
                  </span>
                  <span className="text-slate-400 text-xs font-semibold leading-tight mt-0.5">
                    {course.schedule_time || '8h30 - 17h'}
                  </span>
                </div>
              </div>
            )}

            {/* Vertical Separator */}
            {formattedWeekdayDate && course.location && (
              <span className="text-slate-600/80 hidden sm:inline text-lg font-light">|</span>
            )}

            {/* Location */}
            {course.location && (
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-500 text-2xl shrink-0">location_on</span>
                {course.location_url ? (
                  <a
                    href={course.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-black text-sm sm:text-base hover:text-sky-300 transition-colors cursor-pointer"
                    title="Mở vị trí trên Google Maps"
                  >
                    {course.location}
                  </a>
                ) : (
                  <span className="text-white font-black text-sm sm:text-base">
                    {course.location}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Meta stats */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-3 border-y border-white/10 py-6 mb-8 gap-2 w-full max-w-2xl"
        >
          {[
            { icon: 'groups', value: '01 Ngày', label: 'Offline thực hành' },
            { icon: 'headset_mic', value: '03 Ngày', label: 'Online hỗ trợ' },
            { icon: 'all_inclusive', value: 'Trọn đời', label: 'Học lại miễn phí' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`flex flex-col items-center text-center px-3 ${i < 2 ? 'border-r border-white/10' : ''}`}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2.5">
                <span className="material-symbols-outlined text-white text-lg">{item.icon}</span>
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">{item.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Price + Date */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {date && (
            <div className="grid grid-cols-[auto_1fr] items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 min-h-[68px]">
              <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#0EA5E9] text-base leading-none">calendar_month</span>
              </div>
              <div className="flex flex-col justify-center leading-none text-left">
                <p className="text-white font-bold text-sm leading-tight m-0 p-0">{date}</p>
                <p className="text-slate-400 text-xs leading-tight mt-1 m-0 p-0">{course.schedule_time || '8h30 – 17h00'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-[auto_1fr] items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 min-h-[68px] @container">
            <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#0EA5E9] text-base leading-none">sell</span>
            </div>
            <div className="flex flex-col justify-center leading-none">
              <p className="text-white font-black text-lg leading-tight m-0 p-0">{formatPrice(course.price)}</p>
              <p className="text-slate-400 text-xs leading-tight mt-1 m-0 p-0">Nhóm từ {formatPrice(course.price_group)}/người</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}