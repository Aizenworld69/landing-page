'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import Image from 'next/image';
import { submitRegistration } from './actions';

function CustomSelect({
  label,
  name,
  options,
  icon,
  placeholder,
  required
}: {
  label: string;
  name: string;
  options: string[];
  icon: string;
  placeholder: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [otherValue, setOtherValue] = useState('');

  const isOther = selected === 'Khác';

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-bold text-on-surface-variant font-headline ml-1 uppercase" htmlFor={name}>{label}</label>
      <input type="hidden" name={name} value={isOther ? otherValue : selected} required={required} />

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group cursor-pointer w-full pl-12 pr-12 py-4 bg-surface-container-low border-2 rounded-2xl transition-all duration-300 flex items-center ${isOpen ? 'border-primary bg-white ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:bg-surface-container'
          }`}
      >
        <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isOpen || selected ? 'text-primary' : 'text-on-surface-variant'
          }`}>
          {icon}
        </span>

        <span className={`font-medium ${selected ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>
          {selected || placeholder}
        </span>

        <span className={`material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-on-surface-variant'
          }`}>
          expand_more
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close when clicking outside */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden py-2"
            >
              {options.map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                    if (option !== 'Khác') setOtherValue('');
                  }}
                  className={`px-5 py-3 text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${selected === option
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                >
                  {option}
                  {selected === option && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOther && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <input
              type="text"
              placeholder="Vui lòng nhập thông tin của bạn"
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              required={required}
              className="w-full mt-2 px-5 py-3 bg-surface-container-low border-2 border-primary/20 rounded-xl focus:border-primary focus:bg-white transition-all outline-none text-on-surface text-sm font-medium"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('');

  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['values', 'speakers', 'register'];
      let currentSection = '';

      // Sử dụng ngưỡng 150px từ cạnh trên màn hình để xác định section đang xem
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Nếu phần đỉnh của section vượt qua ngưỡng 150px lên trên, nó là active
          if (rect.top <= 150) {
            currentSection = section;
          }
        }
      }

      // Xoá trạng thái nếu đang ở trên cùng
      if (window.scrollY < 200) {
        currentSection = '';
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check immediately on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAction = async (formData: FormData) => {
    setFormState('loading');
    const result = await submitRegistration(formData);
    if (result.success) {
      setFormState('success');
      setMessage(result.message || 'Thành công!');
    } else {
      setFormState('error');
      setMessage(result.error || 'Có lỗi xảy ra.');
    }
  };

  return (
    <main className="overflow-x-hidden relative min-h-screen">
      {/* Scroll Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-tertiary to-emerald-400 origin-left z-[200] shadow-lg shadow-primary/30"
      />
      {/* Toàn bộ Background */}
      <div className="fixed inset-0 z-[-1]">
        <Image
          src="/new_background.jpg"
          alt="Main Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-white/20"></div>
      </div>
      {/* Toast for Errors */}
      {formState === 'error' ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-28 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl text-white shadow-2xl bg-red-500"
        >
          <span className="material-symbols-outlined">error</span>
          <span className="font-headline font-medium text-sm">{message}</span>
        </motion.div>
      ) : null}

      {/* Success Modal */}
      <AnimatePresence>
        {formState === 'success' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormState('idle')}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[95vh]"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setFormState('idle')}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-6 md:p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <h3 className="text-2xl font-black font-headline text-on-surface mb-1">Đăng ký thành công!</h3>
                <p className="text-slate-500 font-medium text-sm mb-6">Chúng tôi sẽ sớm liên hệ xác nhận với bạn.</p>

                <div className="bg-emerald-50 rounded-2xl p-5 md:p-6 border border-emerald-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-headline font-black text-sm md:text-base text-emerald-800 mb-4 uppercase tracking-wider leading-tight">
                      Vui lòng quét QR thanh toán phí cam kết chia sẻ
                    </h4>

                    <div className="relative group mx-auto w-full max-w-[240px] md:max-w-[280px]">
                      <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                      <div className="relative bg-white p-2.5 rounded-2xl border border-emerald-100 shadow-lg">
                        <Image
                          src="/qr_v1.jpg"
                          alt="QR Phí Tea Break"
                          width={400}
                          height={400}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <p className="font-black text-emerald-700 text-sm">Phí cam kết: 150.000 VND</p>
                      <div className="bg-white/90 backdrop-blur py-2.5 px-4 rounded-xl border border-dashed border-emerald-200 inline-block text-center w-full max-w-[240px]">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Nội dung chuyển khoản</p>
                        <p className="text-sm font-black text-primary tracking-tight">HỌ TÊN - SỐ ĐIỆN THOẠI</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setFormState('idle')}
                    className="w-full max-w-[120px] py-2.5 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <nav className="fixed top-3 sm:top-6 left-2 right-2 sm:left-0 sm:right-0 z-50 bg-white/90 backdrop-blur-xl shadow-md border border-slate-200/50 rounded-full mx-auto max-w-6xl px-1 sm:px-2">
        <div className="flex justify-between items-center px-4 sm:px-6 py-2 sm:py-3">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image
              alt="AIZEN Logo"
              width={160}
              height={32}
              className="h-5 sm:h-7 w-auto object-contain"
              src="/logo.png"
            />
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <a className={`pb-1 font-headline text-sm transition-all ${activeSection === 'values' ? 'text-primary font-bold border-b-[3px] border-primary' : 'text-slate-500 font-semibold hover:text-slate-900 border-b-[3px] border-transparent'}`} href="#values">Giá trị</a>
            <a className={`pb-1 font-headline text-sm transition-all ${activeSection === 'speakers' ? 'text-primary font-bold border-b-[3px] border-primary' : 'text-slate-500 font-semibold hover:text-slate-900 border-b-[3px] border-transparent'}`} href="#speakers">Diễn giả</a>
            <a className={`pb-1 font-headline text-sm transition-all ${activeSection === 'register' ? 'text-primary font-bold border-b-[3px] border-primary' : 'text-slate-500 font-semibold hover:text-slate-900 border-b-[3px] border-transparent'}`} href="#register">Thời gian</a>
          </div>
          <a
            href="#register"
            className="bg-primary text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-full font-headline font-bold text-[10px] sm:text-sm shadow-lg shadow-primary/30 hover:scale-105 transition-all active:scale-95 uppercase tracking-wider"
          >
            Đăng ký Ngay
          </a>
        </div>
      </nav>

      <div className="">
        {/* Hero Section */}
        <section className="relative min-h-screen lg:min-h-[921px] flex flex-col items-center justify-center overflow-hidden pt-32 sm:pt-40 pb-20 sm:pb-32">
          {/* Background Atmospheric Effect */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            {/* Animated Floating Blobs */}
            <motion.div
              animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/30 rounded-full blur-[120px] mix-blend-multiply"
            />
            <motion.div
              animate={{ y: [0, 25, 0], x: [0, -20, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary-container/20 rounded-full blur-[120px] mix-blend-multiply"
            />
            <motion.div
              animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-300/10 rounded-full blur-[100px] mix-blend-multiply"
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            {/* Workshop Badge */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center mb-8"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10"
              >
                <motion.span
                  animate={{ rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="material-symbols-outlined text-base"
                >auto_awesome</motion.span>
                <span className="text-xs font-bold uppercase tracking-widest font-headline">AI WORKSHOP SERIES</span>
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-headline font-extrabold text-on-background tracking-tight leading-tight mb-8 text-center flex flex-col items-center justify-center gap-y-0 sm:gap-y-2"
            >
              <span className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-4">
                <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
                  Buổi 3:
                </span>
                <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-red-600 font-black">
                  8 Tiếng Còn 3 Nhờ
                </span>
              </span>
              <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-red-600 font-black">
                Claude & NotebookLM
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-on-surface-variant max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Khám phá cách sử dụng <strong className="text-primary">Claude AI</strong> và <strong className="text-tertiary">NotebookLM</strong> để tối ưu hóa quy trình làm việc, biến <strong className="text-tertiary">8 tiếng làm việc</strong> thành <strong className="text-primary">3 tiếng hiệu quả</strong>. Trải nghiệm thực hành trực tiếp giúp bạn áp dụng ngay vào công việc!
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <div className="flex flex-col items-center gap-5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 sm:px-12 py-4 sm:py-5 bg-primary text-white rounded-full font-black text-lg sm:text-xl shadow-2xl shadow-primary/40 flex items-center gap-3 group transition-all"
                >
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                  ĐĂNG KÝ THAM GIA
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.8,
                    duration: 0.5
                  }}
                  className="mt-4 flex items-center gap-2 sm:gap-4 px-4 py-3 sm:px-12 sm:py-5 rounded-xl sm:rounded-[2.5rem] bg-white border-2 border-red-100 shadow-2xl shadow-red-600/20"
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[32px] text-red-600">verified</span>
                  <span className="font-headline font-black text-sm sm:text-3xl uppercase tracking-widest italic text-red-600">
                    100% Offline thực hành
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section - 3 Core Benefits */}
        <section id="values" className="bg-white/80 backdrop-blur-md py-24 px-8 relative overflow-hidden scroll-mt-32">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
                <span className="material-symbols-outlined text-sm">star</span>
                <span className="text-xs font-bold uppercase tracking-widest font-headline">3 LỢI ÍCH CỐT LÕI</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black font-headline tracking-tight mb-4 text-red-600">
                Làm chủ Claude AI, NotebookLM &amp; Tối ưu hiệu suất
              </h2>
              <p className="max-w-2xl mx-auto text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-primary animate-gradient-x">
                Học đi đôi với hành — kết quả thực tế ngay tại buổi chia sẻ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,83,204,0.06)] flex flex-col items-start transition-all duration-300 hover:-translate-y-2 border border-primary/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-3xl">timer</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                  <span>Lợi ích 1</span>
                </div>
                <h3 className="text-xl font-black font-headline mb-3 text-on-surface leading-tight">Tiết kiệm 60% thời gian làm việc</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">Cắt giảm thời gian xử lý task từ 8 tiếng xuống còn <strong className="text-on-surface">3 tiếng</strong> nhờ tốc độ siêu tốc của Claude, giải phóng 5 giờ mỗi ngày cho bạn.</p>
              </motion.div>

              {/* Benefit 2 */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group relative bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_rgba(103,80,164,0.06)] flex flex-col items-start transition-all duration-300 hover:-translate-y-2 border border-tertiary/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-tertiary to-tertiary/70 text-white flex items-center justify-center mb-6 shadow-lg shadow-tertiary/30">
                  <span className="material-symbols-outlined text-3xl">trending_up</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                  <span>Lợi ích 2</span>
                </div>
                <h3 className="text-xl font-black font-headline mb-3 text-on-surface leading-tight">Xây dựng &quot;Bộ não thứ 2&quot; cho doanh nghiệp</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">Quản lý <strong className="text-on-surface">hàng ngàn tài liệu</strong> với <strong className="text-on-surface">độ chính xác 100%</strong>, trích dẫn nguồn ngay lập tức, loại bỏ hoàn toàn tình trạng AI <strong className="text-on-surface">&quot;ảo tưởng&quot;</strong> thông tin.</p>
              </motion.div>

              {/* Benefit 3 */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="group relative bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_rgba(16,185,129,0.06)] flex flex-col items-start transition-all duration-300 hover:-translate-y-2 border border-emerald-500/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                  <span className="material-symbols-outlined text-3xl">settings_account_box</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                  <span>Lợi ích 3</span>
                </div>
                <h3 className="text-xl font-black font-headline mb-3 text-on-surface leading-tight">Chuẩn hóa 100% quy trình cốt lõi</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">Tự động hóa hoàn toàn các tác vụ lặp đi lặp lại và xây dựng SOP chuẩn chỉnh, giúp <strong className="text-on-surface">giảm 80% áp lực</strong> vận hành công việc hàng ngày.</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Speakers Section */}
        <section id="speakers" className="py-24 px-8 max-w-7xl mx-auto scroll-mt-40 bg-white/40 backdrop-blur-sm rounded-[4rem] my-24 border border-white/20">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">mic</span>
              <span className="text-xs font-bold uppercase tracking-widest font-headline">DIỄN GIẢ CHƯƠNG TRÌNH</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-surface-container-low rounded-[3rem] p-8 lg:p-12 border border-outline-variant/10 shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
              <div className="w-full lg:w-2/5 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-tertiary rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
                  <div className="w-72 h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden border-8 border-white shadow-xl relative">
                    <Image
                      src="/dien-gia.jpg"
                      alt="Lê Thanh Hải - CEO AIZEN"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-3/5">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline mb-2 text-on-surface tracking-tighter">Lê Thanh Hải</h3>
                <p className="text-lg sm:text-xl font-bold text-primary font-headline mb-6">CEO AIZEN</p>
                <div className="w-16 h-1.5 bg-gradient-to-r from-primary to-tertiary rounded-full mb-8"></div>
                <p className="text-lg text-on-surface-variant leading-relaxed">
                  Chuyên gia với <span className="text-on-surface font-bold">hơn 15 năm kinh nghiệm thực chiến</span> trong ngành Công nghệ thông tin. Anh trực tiếp dẫn dắt lộ trình đưa AI vào vận hành, giúp doanh nghiệp đóng gói quy trình, tối ưu hiệu suất và bứt phá doanh thu từ những trải nghiệm và ứng dụng thực tế nhất.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-xl">share</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Form & Details Section */}
        <section id="register" className="py-24 px-8 max-w-7xl mx-auto relative mb-12 scroll-mt-40">
          <div className="editorial-grid">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="col-span-12 lg:col-span-7 order-2 lg:order-1"
            >
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Thời gian</p>
                    <p className="font-bold text-on-surface">Thứ Bảy, 06/06/2026</p>
                    <p className="text-sm text-on-surface-variant mb-2">08:30 - 11:30</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Hạn chót Đăng Ký: 03/06</span>
                    </div>
                  </div>
                  <motion.a
                    href="https://maps.app.goo.gl/b1KLmyfsSRXJrSfD9"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -5 }}
                    className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:border-primary/40 hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl rotate-12">map</span>
                    </div>

                    <div className="relative mb-4">
                      <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div className="absolute inset-0 bg-tertiary/20 rounded-xl animate-ping opacity-40"></div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Địa điểm</p>
                    <p className="font-bold text-on-surface mb-1">11 Nguyễn Đình Chiểu, P. Đa Kao, TPHCM</p>
                    <p className="text-[10px] leading-tight text-on-surface-variant mb-2">(Trung tâm Đào tạo Bưu chính Viễn thông PTTC - Học viện PTIT)</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                      <span>Xem trên bản đồ</span>
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </motion.a>
                  <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">laptop_mac</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Yêu cầu</p>
                    <p className="font-bold text-on-surface">Thiết bị cá nhân</p>
                    <p className="text-sm text-on-surface-variant">Mang theo Laptop cá nhân</p>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Chi phí</p>
                    <p className="font-bold text-on-surface">150.000 VND</p>
                    <p className="text-sm text-on-surface-variant">Phí giữ chỗ &amp; Tea-break</p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-2/5">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-tertiary/30 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                          <Image
                            src="/qr_v1.jpg"
                            alt="QR thanh toán"
                            width={300}
                            height={300}
                            className="w-full h-auto rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-3/5">
                      <h3 className="text-xl font-black font-headline mb-4">Thông tin chuyển khoản</h3>
                      <div className="space-y-2 text-sm text-on-surface-variant">
                        <p><span className="font-bold text-on-surface">Ngân hàng:</span> TPBank</p>
                        <p><span className="font-bold text-on-surface">Chủ tài khoản:</span> NGUYEN HOANG MINH</p>
                        <p><span className="font-bold text-on-surface">Số tài khoản:</span> <span className="text-primary font-bold">0000 5895 437</span></p>
                        <p><span className="font-bold text-on-surface">Nội dung:</span> Workshop3 [Họ Tên] [SĐT]</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="col-span-12 lg:col-span-5 order-1 lg:order-2 lg:pl-16"
            >
              <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-outline-variant/10">
                <h3 className="text-red-600 font-black font-headline text-lg sm:text-xl lg:text-2xl mb-3 tracking-tight uppercase italic text-center lg:text-left">BUỔI 3: 8 TIẾNG CÒN 3 - NHỜ CLAUDE & NOTEBOOKLM</h3>
                <h2 className="text-2xl sm:text-3xl font-black font-headline mb-2 tracking-tight text-center lg:text-left">Đăng ký tham gia ngay</h2>
                <p className="text-sm text-on-surface-variant mb-6 sm:mb-8 text-center lg:text-left">Hoàn thành thông tin bên dưới để giữ chỗ.</p>
                <form action={handleAction} className="space-y-6">
                  {/* Honeypot field - Hidden from users, only visible to spam bots */}
                  <div className="hidden" aria-hidden="true">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant font-headline ml-1 uppercase" htmlFor="fullname">Họ và tên</label>
                    <input id="fullname" name="fullname" className="w-full px-5 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none text-on-surface" placeholder="Nhập họ và tên của bạn" type="text" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant font-headline ml-1 uppercase" htmlFor="phone">Số điện thoại</label>
                    <input id="phone" name="phone" className="w-full px-5 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none text-on-surface" placeholder="09xx xxx xxx" type="tel" pattern="^(0|84)(3|5|7|8|9|1[2689])([0-9]{8})$" title="Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số)" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant font-headline ml-1 uppercase" htmlFor="email">Email công việc</label>
                    <input id="email" name="email" className="w-full px-5 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none text-on-surface" placeholder="name@company.com" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant font-headline ml-1 uppercase" htmlFor="company">Tên công ty</label>
                    <input id="company" name="company" className="w-full px-5 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none text-on-surface" placeholder="Nhập tên công ty của bạn" type="text" required />
                  </div>

                  <CustomSelect
                    label="Bạn biết đến sự kiện từ đâu?"
                    name="referral"
                    icon="group"
                    placeholder="Chọn nguồn tin"
                    options={[
                      "Cộng Đồng AI ỨNG DỤNG SALE & MARKETING",
                      "Khách hàng AIZEN",
                      "Người quen giới thiệu",
                      "Khác"
                    ]}
                    required
                  />

                  <CustomSelect
                    label="Bạn là?"
                    name="role"
                    icon="work"
                    placeholder="Chọn vị trí của bạn"
                    options={[
                      "Chủ doanh nghiệp",
                      "Quản lý phòng ban",
                      "Nhân viên",
                      "Sinh viên",
                      "Khác"
                    ]}
                    required
                  />

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={formState === 'loading'}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/30 hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {formState === 'loading' ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">send</span>
                          Gửi thông tin đăng ký
                        </>
                      )}
                    </button>
                    <p className="text-xs text-on-surface-variant text-center mt-4">
                      Cam kết bảo mật thông tin theo chính sách quyền riêng tư của Workshop.
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer id="partners" className="bg-white w-full border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start">
            {/* Cột 1: Logo & Giới thiệu */}
            <div className="flex flex-col gap-6">
              <a
                href="https://aizenworld.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity cursor-pointer inline-block"
              >
                <Image
                  alt="AIZEN Logo"
                  width={160}
                  height={32}
                  className="h-8 w-auto object-contain"
                  src="/logo.png"
                />
              </a>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Đồng hành cùng doanh nghiệp trong kỷ nguyên trí tuệ nhân tạo. Giải pháp tối ưu, hiệu suất đột phá và thực chiến.
              </p>
            </div>

            {/* Cột 2: Thông tin liên hệ */}
            <div className="flex flex-col gap-6">
              <h4 className="font-headline font-bold text-slate-900 uppercase tracking-widest text-xs">Thông tin liên hệ</h4>
              <div className="space-y-4">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=112+L%C3%BD+Ph%E1%BB%A5c+Man,+Ph%C6%B0%E1%BB%9Dng+T%C3%A2n+Thu%E1%BA%ADn,+Th%C3%A0nh+ph%E1%BB%91+H%E1%BB%93+Ch%C3%AD+Minh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-slate-600 hover:text-primary transition-colors group"
                >
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5 group-hover:scale-110 transition-transform">location_on</span>
                  <p className="text-sm font-medium leading-relaxed">
                    112 Lý Phục Man, Phường Tân Thuận, TP. Hồ Chí Minh
                  </p>
                </a>
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="material-symbols-outlined text-primary text-xl">call</span>
                  <p className="text-sm font-medium">0362 077 399</p>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="material-symbols-outlined text-primary text-xl">mail</span>
                  <p className="text-sm font-medium">info@aizenworld.com</p>
                </div>
              </div>
            </div>

            {/* Cột 3: Liên kết & Chính sách */}
            <div className="flex flex-col gap-6">
              <h4 className="font-headline font-bold text-slate-900 uppercase tracking-widest text-xs">Chính sách & Liên kết</h4>
              <div className="flex flex-col gap-3">
                <a className="text-slate-500 hover:text-primary transition-colors text-sm font-medium" href="#">Chính sách bảo mật</a>
                <a className="text-slate-500 hover:text-primary transition-colors text-sm font-medium" href="#">Điều khoản dịch vụ</a>
                <a className="text-slate-500 hover:text-primary transition-colors text-sm font-medium" href="#">Liên hệ hỗ trợ</a>
                <a className="text-slate-500 hover:text-primary transition-colors text-sm font-medium" href="#">Đơn vị tổ chức</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs font-medium">© 2026 AIZEN World. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">public</span>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">account_circle</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* Floating Zalo Button */}
      <a
        href="https://zalo.me/0362077399"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] flex items-center gap-2 bg-[#0068ff] text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95 group"
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.01 2c-5.523 0-10 3.731-10 8.333 0 2.404 1.206 4.562 3.125 6.075-.24 1.157-1.125 3.328-1.125 3.328a.5.5 0 00.741.528c.026-.016 3.14-1.996 4.316-2.775.92.179 1.9.274 2.91.274 5.522 0 10-3.731 10-8.333S17.532 2 12.01 2z" fill="#0068ff" />
          </svg>
        </div>
        <span className="font-headline font-bold text-sm tracking-tight">Hỗ trợ Zalo</span>
        <div className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </div>
      </a>
    </main>
  );
}
