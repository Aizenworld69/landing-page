'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import Image from 'next/image';
import { eventDate, eventAddress, eventPrice } from '../lib/siteConfig';
import { submitRegistration, submitGroupRegistration } from './actions';
import { SpotlightEffects } from './SpotlightEffects';

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
      <label className="text-sm font-bold text-slate-200 font-headline ml-1 uppercase" htmlFor={name}>{label}</label>
      <input type="hidden" name={name} value={isOther ? otherValue : selected} required={required} />

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group cursor-pointer w-full pl-12 pr-12 py-4 bg-white/8 border-2 rounded-2xl transition-all duration-300 flex items-center ${isOpen ? 'border-[#3b82f6] bg-white/8 ring-4 ring-[#3b82f6]/10 shadow-lg' : 'border-transparent hover:bg-white/8'
          }`}
      >
        <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isOpen || selected ? 'text-primary' : 'text-slate-200'
          }`}>
          {icon}
        </span>

        <span className={`font-medium ${selected ? 'text-white' : 'text-slate-200'}`}>
          {selected || placeholder}
        </span>

        <span className={`material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#3b82f6]' : 'text-slate-200'
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
              className="absolute left-0 right-0 z-50 bg-[#13283e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden py-2"
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
                    : 'text-slate-200 hover:bg-white/5'
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
              className="w-full mt-2 px-5 py-3 bg-white/8 border-2 border-[#3b82f6]/20 rounded-xl focus:border-[#3b82f6] focus:bg-white/10 transition-all outline-none text-white glow-white text-sm font-medium"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SkillCard({
  icon,
  iconColor,
  iconBg,
  title,
  description
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="group bg-[#13283e] p-8 rounded-3xl shadow-[0_0_40px_rgba(59, 130, 246,0.05)] hover:shadow-[0_0_60px_rgba(59, 130, 246,0.08)] transition-all border border-white/8 hover:border-[#3b82f6]/30 hover:bg-white/6 flex flex-col items-center justify-between min-h-[260px] text-center"
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-6`}>
          <span className="material-symbols-outlined text-2xl font-bold">{icon}</span>
        </div>
        <h3 className="text-lg font-black font-headline text-[#3b82f6] mb-3 tracking-tight">{title}</h3>
        <p className="text-white glow-white text-sm leading-relaxed font-normal">
          {description}
        </p>
      </div>
      <div className="h-4"></div>
    </motion.div>
  );
}

export default function Home() {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [paymentContent, setPaymentContent] = useState('HỌ TÊN - SĐT');
  const [paymentAmount, setPaymentAmount] = useState(2200000);
  const [registeredPkg, setRegisteredPkg] = useState('Nhóm 2 người');
  const [selectedPackage, setSelectedPackage] = useState('Nhóm 2 người');
  const [formStep, setFormStep] = useState<number>(1);
  const [fullnameInput, setFullnameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  // Modal đăng ký nhóm
  const [showRegModal, setShowRegModal] = useState(false);
  const [modalPkg, setModalPkg] = useState('Nhóm 2 người');
  const [regFormState, setRegFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [regError, setRegError] = useState('');

  // Countdown target: 2026-06-27T08:00:00+07:00
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setMounted(true));
    const target = new Date('2026-06-27T08:00:00+07:00').getTime();

    const updateTime = () => {
      const now = new Date().getTime();
      const difference = target - now;
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const timeData = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
        setTimeLeft(timeData);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['skills', 'timeline', 'speakers', 'register'];
      let currentSection = '';

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            currentSection = section;
          }
        }
      }

      if (window.scrollY < 200) {
        currentSection = '';
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAction = async (formData: FormData) => {
    setFormState('loading');
    const result = await submitRegistration(formData);
    if (result.success) {
      // lưu tên + phone đã gửi để hiển thị trong modal QR
      const sentName = formData.get('fullname')?.toString().trim() ?? '';
      const sentPhone = formData.get('phone')?.toString().trim() ?? '';
      setSubmittedName(sentName);
      setSubmittedPhone(sentPhone);
      setPaymentContent(result.paymentContent ?? 'HỌ TÊN - SĐT');
      setPaymentAmount(result.amount ?? 2200000);
      setRegisteredPkg(result.packageType ?? 'Nhóm 2 người');
      setFormState('success');
      setMessage(result.message || 'Thành công!');
    } else {
      setFormState('error');
      setMessage(result.error || 'Có lỗi xảy ra.');
    }
  };

  const openRegModal = (pkg: string) => {
    setModalPkg(pkg);
    setRegFormState('idle');
    setRegError('');
    setShowRegModal(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegFormState('loading');
    const formData = new FormData(e.currentTarget);
    const result = await submitGroupRegistration(formData);
    if (result.success) {
      setRegFormState('success');
    } else {
      setRegFormState('error');
      setRegError(result.error);
    }
  };

  const getQRImage = (pkg: string) => {
    if (pkg === 'Nhóm 2 người') return '/2nguoi.jpg';
    if (pkg === 'Nhóm 4 người') return '/4nguoi.jpg';
    return '/1nguoi.jpg'; // Early Bird + 1 người
  };

  const getMemberCount = (pkg: string) => {
    if (pkg === 'Nhóm 2 người') return 2;
    if (pkg === 'Nhóm 4 người') return 4;
    return 1;
  };

  const timelineData = [
    { time: '8:00', title: 'Check-in & warming up', description: '', badge: '30 PHÚT' },
    { time: '8:30', title: 'Module 1: Tư duy đúng về AI', description: 'Bộ 3: Mindset – Skillset – Toolset; Cấu trúc Prompt chuẩn', badge: '30 PHÚT' },
    { time: '9:00', title: 'Module 2: Bộ 4 công cụ cốt lõi của Claude', description: 'Skills - não bộ chuyên môn; Projects - bộ nhớ dài hạn', badge: '1 GIỜ' },
    { time: '10:00', title: 'Giải lao & Tea-break', description: '', badge: '20 PHÚT' },
    { time: '10:20', title: 'Module 3: Bộ 4 công cụ cốt lõi của Claude', description: 'Connectors - cầu nối ra thế giới bên ngoài\nArtifacts - xưởng sản xuất đầu ra', badge: '1 GIỜ' },
    { time: '11:20', title: 'Module 4: Tạo Landing Page quảng cáo cùng Claude', description: '', badge: '40 PHÚT' },
    { time: '12:00', title: 'Nghỉ trưa & Networking', description: '', badge: '1 GIỜ 20 PHÚT' },
    { time: '13:20', title: 'Warming up', description: '', badge: '10 PHÚT' },
    { time: '13:30', title: 'Module 5: Claude + Canva', description: '', badge: '30 PHÚT' },
    { time: '14:00', title: 'Module 6: Claude Cowork (phần 1)', description: '', badge: '1 GIỜ 30 PHÚT' },
    { time: '15:30', title: 'Giải lao & Tea-break', description: '', badge: '15 PHÚT' },
    { time: '15:45', title: 'Module 6: Claude Cowork (phần 2)', description: '', badge: '30 PHÚT' },
    { time: '16:15', title: 'Demo - Q&A', description: '', badge: '45 PHÚT' },
    { time: '17:00', title: 'Kết thúc', description: '', badge: 'HOÀN THÀNH' }
  ];

  const displayPkg = registeredPkg || modalPkg || selectedPackage;

  return (
    <main className="overflow-x-hidden relative min-h-screen" style={{ background: '#0e2434' }}>
      <SpotlightEffects />      {/* Scroll Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#38bdf8] to-blue-400 origin-left z-[200] shadow-lg shadow-[0_0_20px_rgba(59, 130, 246,0.12)]"
      />

      {/* Toast for Errors */}
      {formState === 'error' ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-28 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl text-white glow-white shadow-2xl bg-red-500"
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
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <h3 className="text-2xl font-black font-headline text-[#2c2f31] mb-1">Đăng ký thành công!</h3>
                <p className="text-slate-500 font-medium text-sm mb-6">Chúng tôi sẽ sớm liên hệ xác nhận với bạn....</p>

                <div className="bg-blue-50/50 rounded-2xl p-5 md:p-6 border border-blue-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-headline font-black text-sm md:text-base text-blue-800 mb-4 uppercase tracking-wider leading-tight">
                      {displayPkg === 'Nhóm 4 người'
                        ? 'Nhóm 4 người, phí đầu tư: 1.300.000 x 4 = 5.200.000, giảm còn 3.960.000'
                        : displayPkg === 'Nhóm 2 người'
                          ? 'Nhóm 2 người, phí đầu tư: 1.300.000 x 2 = 2.600.000, giảm còn 2.200.000'
                          : 'Vui lòng quét QR thanh toán học phí'}
                    </h4>

                    <div className="relative group mx-auto w-full max-w-[240px] md:max-w-[280px]">
                      {/* Dynamic header: show entered fullname and phone above QR (preview) */}
                      {(submittedName || submittedPhone) && (
                        <div className="mb-3 text-left">
                          <p className="text-xs text-slate-400">Quét mã để chuyển tiền đến</p>
                          <p className="font-black text-white">{submittedName || 'NGUYEN HOANG MINH'}</p>
                          {submittedPhone && <p className="text-sm text-slate-300">{submittedPhone}</p>}
                        </div>
                      )}
                      <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                      <div className="relative bg-white p-2.5 rounded-2xl border border-blue-100 shadow-lg">
                        <Image
                          src={`https://img.vietqr.io/image/TPB-00005895437-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(paymentContent)}&accountName=${encodeURIComponent(submittedName || 'NGUYEN HOANG MINH')}`}
                          alt="QR Thanh toán"
                          width={280}
                          height={280}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <p className="font-black text-blue-700 text-sm">Gói đăng ký: {registeredPkg}</p>
                      <p className="font-black text-blue-700 text-sm">Học phí: {paymentAmount.toLocaleString('vi-VN')} VND</p>
                      <div className="bg-white/90 backdrop-blur py-2.5 px-4 rounded-xl border border-dashed border-blue-200 inline-block text-center w-full max-w-[240px]">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Nội dung chuyển khoản</p>
                        <p className="text-sm font-black text-primary tracking-tight">{paymentContent}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setFormState('idle')}
                    className="w-full max-w-[120px] py-2.5 bg-slate-900 text-white glow-white rounded-full font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <nav className="fixed top-3 sm:top-6 left-2 right-2 sm:left-0 sm:right-0 z-50 bg-[#0e2434]/80 backdrop-blur-xl shadow-md border border-white/10 rounded-full mx-auto max-w-6xl px-1 sm:px-2">
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
            <a className={`pb-1 font-headline text-sm transition-all ${activeSection === 'skills' ? 'text-[#3b82f6] font-bold border-b-[3px] border-[#3b82f6]' : 'text-slate-300 font-semibold hover:text-white border-b-[3px] border-transparent'}`} href="#skills">Kỹ năng</a>
            <a className={`pb-1 font-headline text-sm transition-all ${activeSection === 'timeline' ? 'text-[#3b82f6] font-bold border-b-[3px] border-[#3b82f6]' : 'text-slate-300 font-semibold hover:text-white border-b-[3px] border-transparent'}`} href="#timeline">Lộ trình</a>
            <a className={`pb-1 font-headline text-sm transition-all ${activeSection === 'speakers' ? 'text-[#3b82f6] font-bold border-b-[3px] border-[#3b82f6]' : 'text-slate-300 font-semibold hover:text-white border-b-[3px] border-transparent'}`} href="#speakers">Diễn giả</a>
          </div>
          <a
            href="#register"
            className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-full font-headline font-bold text-[10px] sm:text-sm shadow-lg hover:scale-105 transition-all active:scale-95 uppercase tracking-wider bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] text-[#0e2434]"
          >
            Đăng ký Ngay
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-[#0f2634] text-white pt-36 pb-6 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Atmospheric Orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-40 w-96 h-96 bg-[#3b82f6]/15 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-4"
          >
            <Image
              src="/logocuoi.jpg"
              alt="3 Logos - PTIT, PTTC, AIZEN"
              width={240}
              height={60}
              className="h-12 sm:h-16 w-auto object-contain"
            />
          </motion.div>


          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-xs sm:text-sm font-black tracking-widest text-[#3b82f6] uppercase mb-4"
          >
            Khóa học từ cơ bản đến chuyên sâu
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black font-headline tracking-tight leading-none mb-6"
          >
            Làm chủ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#38bdf8]">Claude AI</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-2xl text-slate-300 font-medium font-headline tracking-wide max-w-2xl mb-8 leading-relaxed italic text-center"
          >
            Xây dựng trợ lý phòng ban<br />tự động làm việc
          </motion.p>


          {/* Meta tags */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-6 text-sm text-slate-300 font-bold mb-12"
          >
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-cyan-400 text-lg shrink-0">calendar_month</span>
                <span className="text-slate-300">{eventDate}</span>
              </div>
              <span className="text-slate-400 text-xs font-normal ml-6">8h30 - 17h</span>
            </div>

            <span className="hidden sm:inline-block h-4 border-l border-slate-600" />

            <div className="flex items-start gap-1">
              <span className="material-symbols-outlined text-blue-500 text-lg shrink-0 mt-0.5">place</span>
              <a 
                href="https://www.google.com/maps/place/Trung+t%C3%A2m+%C4%90%C3%A0o+T%E1%BA%A1o+B%C6%B0u+ch%C3%ADnh+Vi%E1%BB%85n+th%C3%B4ng/@10.7896789,106.7006799,779m/data=!3m1!1e3!4m6!3m5!1s0x317528b54fb5699d:0xa19aa146dff27e08!8m2!3d10.7893722!4d106.7007822!16s%2Fg%2F11b5phr1rt?entry=ttu&g_ep=EgoyMDI2MDYwMy4xIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 text-left hover:text-blue-400 transition-colors cursor-pointer"
              >
                {eventAddress.includes('(') ? (
                  <>
                    {eventAddress.split('(')[0].trim()}
                    <br />
                    <span className="text-slate-400 text-xs font-normal">({eventAddress.split('(')[1]}</span>
                  </>
                ) : (
                  eventAddress
                )}
              </a>
            </div>


          </motion.div>

          {/* Prominent badges: 01 ngày offline / 03 ngày online / Học lại trọn đời (moved below meta) */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {[
              { text: '01 ngày offline thực hành', icon: '/icon1.png' },
              { text: '03 ngày online hỗ trợ', icon: '/icon2.png' },
              { text: 'Học lại trọn đời', icon: '/icon3.png' }
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full text-white glow-white font-black text-sm sm:text-base bg-white/5 border border-white/10"
                style={{
                  textShadow: '0 0 18px rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 30px rgba(59, 130, 246,0.04)'
                }}
              >
                <Image
                  src={item.icon}
                  alt="icon"
                  width={32}
                  height={32}
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
                />
                <span>{item.text}</span>
              </div>
            ))}
          </div>


          {/* Countdown area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center w-full"
          >
            <p className="text-[10px] sm:text-xs font-black tracking-widest text-[#3b82f6] uppercase mb-4">KHAI GIẢNG SAU</p>
            <div className="flex items-center gap-2 sm:gap-4 select-none">
              {/* Days */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/60 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl sm:text-4xl font-black text-white glow-white font-headline">
                    {mounted ? String(timeLeft.days).padStart(2, '0') : '00'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Ngày</span>
              </div>

              <span className="text-xl sm:text-2xl font-black text-slate-500 -mt-6">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/60 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl sm:text-4xl font-black text-white glow-white font-headline">
                    {mounted ? String(timeLeft.hours).padStart(2, '0') : '00'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Giờ</span>
              </div>

              <span className="text-xl sm:text-2xl font-black text-slate-500 -mt-6">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/60 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl sm:text-4xl font-black text-white glow-white font-headline">
                    {mounted ? String(timeLeft.minutes).padStart(2, '0') : '00'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Phút</span>
              </div>

              <span className="text-xl sm:text-2xl font-black text-slate-500 -mt-6">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/60 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl sm:text-4xl font-black text-white glow-white font-headline text-cyan-400">
                    {mounted ? String(timeLeft.seconds).padStart(2, '0') : '00'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Giây</span>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto mt-16 leading-relaxed font-normal text-center font-headline"
          >
            Chương trình được thiết kế với các module từ cơ bản đến chuyên sâu giúp bạn làm chủ hoàn toàn <span className="text-white font-bold">CLAUDE AI</span>, từ xây dựng tư duy đúng khi sử dụng AI, sử dụng thành thạo từng module đến áp dụng thực tế vào chính doanh nghiệp của bạn, giúp tối ưu vận hành và chi phí.
          </motion.p>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="bg-[#11283c] pt-10 pb-12 px-6 md:px-8 relative overflow-hidden scroll-mt-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black tracking-widest text-[#3b82f6] uppercase">KỸ NĂNG BẠN SẼ CÓ</span>
            <h2 className="text-3xl sm:text-5xl font-black font-headline text-white glow-white mt-2">
              Kết thúc khóa học<br />bạn sở hữu ngay
            </h2>
          </div>

          {/* Top Grid: 3 cards (Cowork spans 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1: Claude Cowork (Highlighted, dark teal bg) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="lg:col-span-2 bg-gradient-to-br from-[#3b82f6]/20 to-[#38bdf8]/10 text-white glow-white p-8 rounded-3xl shadow-xl flex flex-col items-center justify-between border border-[#3b82f6]/30 transition-all relative overflow-hidden group min-h-[260px] text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform"></div>

              <div className="flex flex-col items-center text-center w-full">
                <div className="flex flex-col items-center mb-6 w-full gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white glow-white text-2xl font-bold">groups</span>
                  </div>
                  <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full tracking-wider">ĐẶC BIỆT</span>
                </div>
                <h3 className="text-2xl font-black font-headline mb-3 text-[#3b82f6]">Claude Cowork</h3>
                <p className="text-blue-100 text-sm leading-relaxed font-normal">
                  Cowork là cả một phòng ban AI trong lòng bàn tay - mỗi agent đảm nhận một vai trò, tự vận hành, tự phối hợp với nhau, và giao cho bạn kết quả cuối cùng như một đội ngũ thực thụ.
                </p>
              </div>
              <div className="h-4"></div>
            </motion.div>

            {/* Card 2: Claude Skills */}
            <SkillCard
              icon="psychology"
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
              title="Claude Skills"
              description="Biến mỗi nhân sự hoặc quy trình công ty thành Skill cố định - gọi một lúc nhiều Skills, Claude tự xử lý đa nhiệm mà không cần ra lệnh lại."
            />

            {/* Card 3: Claude Projects */}
            <SkillCard
              icon="folder_open"
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              title="Claude Projects"
              description="Giao việc cho đúng người, giúp bạn tạo ra những 'chuyên gia ảo' theo từng lĩnh vực, luôn hiểu đúng context và làm việc theo chuẩn của bạn."
            />
          </div>

          {/* Bottom Grid: 4 cards on 1 row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Card 4: Claude Connectors */}
            <SkillCard
              icon="hub"
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              title="Claude Connectors"
              description="Chìa khóa để Claude kết nối với hệ thống công việc như Gmail, Google Drive, Calendar... để xây dựng các trợ lý tự động."
            />

            {/* Card 5: Claude Artifacts */}
            <SkillCard
              icon="layers"
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
              title="Claude Artifacts"
              description="Xây luôn cho bạn một app, website, landingpage hay công cụ tương tác ngay trong khung chat, không cần code."
            />

            {/* Card 6: Claude + Canva */}
            <SkillCard
              icon="draw"
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              title="Claude + Canva"
              description="Hai công cụ kết hợp liền mạch để biến ý tưởng thiết kế của bạn thành ấn phẩm hoàn chỉnh."
            />

            {/* Card 8: 10 Mẹo tối ưu Token */}
            <SkillCard
              icon="token"
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
              title="10 Mẹo tối ưu Token"
              description="Các kỹ thuật tối ưu hóa chi phí khi sử dụng token mà vẫn giữ nguyên chất lượng."
            />
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="timeline" className="bg-[#0e2434] pt-10 pb-12 px-6 md:px-8 relative overflow-hidden scroll-mt-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-black tracking-widest text-[#3b82f6] uppercase">Nội dung chương trình</span>
            <h2 className="text-3xl sm:text-5xl font-black font-headline text-white glow-white mt-2">1 ngày - 6 module thực chiến</h2>
          </motion.div>

          <div className="relative border-l-2 border-[#3b82f6]/20 ml-4 md:ml-32 pl-8 space-y-12 py-4">
            {timelineData.map((item, index) => {
              const isActive = index === 0;
              const isCompleted = index === timelineData.length - 1;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="relative text-left"
                >
                  {/* Time indicator for medium screens */}
                  <div className="hidden md:block absolute -left-40 top-1.5 w-24 text-right pr-4">
                    <span className={`text-base font-black font-headline ${isActive ? 'text-[#1a7a5e]' : 'text-slate-400'}`}>
                      {item.time}
                    </span>
                  </div>

                  {/* Circle marker on the line */}
                  <div className="absolute -left-[41px] top-1.5 flex items-center justify-center">
                    {isActive ? (
                      <div className="w-6 h-6 rounded-full bg-[#1a7a5e] border-4 border-white flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white glow-white text-[12px] font-black">add</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-[#1a7a5e] border-4 border-white flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white glow-white text-[12px] font-black">check</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#13283e] border-4 border-white/8 flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div className={`p-6 rounded-2xl border transition-all ${isActive
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 shadow-md shadow-[#3b82f6]/6'
                    : isCompleted
                      ? 'bg-white/4 border-[#3b82f6]/15'
                      : 'bg-[#13283e] border-white/8 hover:shadow-md'
                    }`}>
                    {/* Mobile Time */}
                    <div className="md:hidden mb-2">
                      <span className={`text-sm font-black font-headline ${isActive ? 'text-[#1a7a5e]' : 'text-slate-500'}`}>
                        {item.time}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className={`text-lg font-black font-headline ${isActive ? 'text-[#3b82f6]' : 'text-white'}`}>
                          {item.title}
                        </h3>
                        <p className="text-white glow-white text-sm font-normal mt-1 leading-relaxed whitespace-pre-line">{item.description}</p>
                      </div>
                      <div className="shrink-0 flex items-start">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isCompleted
                          ? 'bg-blue-100 text-blue-700'
                          : isActive
                            ? 'bg-[#1a7a5e] text-white'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Speakers Section */}
      <section id="speakers" className="pt-10 pb-12 px-8 max-w-7xl mx-auto scroll-mt-40 bg-[#0e2434]/80 backdrop-blur-sm rounded-[4rem] mt-6 mb-6 border border-white/10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6]/10 text-[#3b82f6] rounded-full mb-4">
            <span className="material-symbols-outlined text-sm">mic</span>
            <span className="text-xs font-bold uppercase tracking-widest font-headline">DIỄN GIẢ CHƯƠNG TRÌNH</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="bg-[#11283c] rounded-[3rem] p-8 lg:p-12 border border-white/10 shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/8 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
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
            <div className="w-full lg:w-3/5 text-left">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline mb-2 text-white tracking-tighter">Lê Thanh Hải</h3>
              <p className="text-lg sm:text-xl font-bold text-[#3b82f6] font-headline mb-6">CEO AIZEN</p>
              <div className="w-16 h-1.5 bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] rounded-full mb-8"></div>
              <p className="text-lg text-white/80 leading-relaxed text-justify">
                Chuyên gia với <span className="text-white font-bold">hơn 15 năm kinh nghiệm thực chiến</span> trong ngành Công nghệ thông tin. Anh trực tiếp dẫn dắt lộ trình đưa AI vào vận hành, giúp doanh nghiệp đóng gói quy trình, tối ưu hiệu suất và bứt phá doanh thu từ những trải nghiệm và ứng dụng thực tế nhất.
              </p>
              <div className="mt-8 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-slate-300 hover:text-[#3b82f6] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-xl">share</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-slate-300 hover:text-[#3b82f6] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing / Register Section */}
      <section id="register" className="pt-10 pb-24 px-6 md:px-8 scroll-mt-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-black tracking-widest text-[#3b82f6] uppercase">Đăng ký</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-headline text-white text-center mb-12">
            Chọn hình thức đăng ký
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

            {/* Card 1: Early Bird */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="relative flex flex-col bg-[#13283e]/40 border border-slate-800 rounded-3xl p-6 shadow-lg opacity-50 grayscale transition-all select-none"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-full shadow border border-slate-700">Đã hết hạn</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">bolt</span>
              </div>
              <p className="font-black text-slate-400 text-lg font-headline">Early Bird</p>
              <p className="text-slate-400 text-xs mb-4">1 người · Đã kết thúc - Ngày 7/6/2026</p>
              <div className="mb-1">
                <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-black rounded-md uppercase tracking-wider">Hết hạn</span>
              </div>
              <p className="text-slate-500 line-through text-sm mb-1">1.200.000đ</p>
              <p className="text-3xl font-black text-slate-400 font-headline mb-1">950.000đ</p>
              <p className="text-slate-500 text-xs mb-6">Tổng: 950.000đ</p>
              <button
                type="button"
                disabled
                className="mt-auto w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-500 font-bold text-sm text-center cursor-not-allowed"
              >
                Đã hết hạn đăng ký
              </button>
            </motion.div>

            {/* Card 2: 1 người thường - MỚI */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="relative flex flex-col bg-[#13283e] border border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-blue-400/10 hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/15 text-[#3b82f6] flex items-center justify-center mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <p className="font-black text-white text-lg font-headline">1 người</p>
              <p className="text-slate-400 text-xs mb-4">Đăng ký cá nhân</p>
              <div className="mb-1 h-6" />
              <p className="text-slate-500 text-sm mb-1 invisible">–</p>
              <p className="text-3xl font-black text-white font-headline mb-1">1.300.000đ</p>
              <p className="text-slate-400 text-xs mb-6">Tổng: 1.300.000đ</p>
              <button
                type="button"
                onClick={() => openRegModal('1 người')}
                className="mt-auto w-full py-3 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] text-[#0e2434] font-black text-sm text-center hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Đăng ký ngay →
              </button>
            </motion.div>

            {/* Card 3: Nhóm 2 người */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="relative flex flex-col bg-[#0c1e33] border-2 border-[#3b82f6]/60 rounded-3xl p-6 shadow-xl shadow-blue-500/10 hover:-translate-y-1 transition-all"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] text-[#0e2434] text-[10px] font-black uppercase tracking-wider rounded-full shadow">Hot nhất</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/15 text-[#3b82f6] flex items-center justify-center mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <p className="font-black text-white text-lg font-headline">Nhóm 2 người</p>
              <p className="text-slate-400 text-xs mb-4">Đăng ký cùng 1 người</p>
              <div className="mb-1">
                <span className="inline-block px-2 py-0.5 bg-[#3b82f6]/15 text-[#38bdf8] text-[10px] font-black rounded-md uppercase tracking-wider">Giảm 15%</span>
              </div>
              <p className="text-slate-500 line-through text-sm mb-1">1.300.000đ</p>
              <p className="text-3xl font-black text-white font-headline mb-1">1.100.000đ</p>
              <p className="text-slate-400 text-xs mb-6">Tổng nhóm: 2.200.000đ</p>
              <button
                type="button"
                onClick={() => openRegModal('Nhóm 2 người')}
                className="mt-auto w-full py-3 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] text-[#0e2434] font-black text-sm text-center hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Đăng ký ngay →
              </button>
            </motion.div>

            {/* Card 4: Nhóm 4 người */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24 }}
              className="relative flex flex-col bg-[#13283e] border border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-blue-400/10 hover:-translate-y-1 transition-all"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-white/15">Tiết kiệm</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-700/60 text-slate-300 flex items-center justify-center mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <p className="font-black text-white text-lg font-headline">Nhóm 4 người</p>
              <p className="text-slate-400 text-xs mb-4">Đăng ký cùng 4 người</p>
              <div className="mb-1">
                <span className="inline-block px-2 py-0.5 bg-slate-700/60 text-slate-300 text-[10px] font-black rounded-md uppercase tracking-wider">Giảm 24%</span>
              </div>
              <p className="text-slate-500 line-through text-sm mb-1">5.200.000đ</p>
              <p className="text-3xl font-black text-white font-headline mb-1">990.000đ</p>
              <p className="text-slate-400 text-xs mb-6">Tổng nhóm: 3.960.000đ</p>
              <button
                type="button"
                onClick={() => openRegModal('Nhóm 4 người')}
                className="mt-auto w-full py-3 rounded-2xl bg-white/8 border border-white/15 text-slate-200 font-bold text-sm text-center hover:bg-white/12 transition-colors cursor-pointer"
              >
                Đăng ký nhóm →
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer */}

      <footer id="partners" className="bg-[#070e1a] text-slate-400 w-full py-12 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start py-6">
            {/* Cột 1: Logo & Giới thiệu */}
            <div className="flex flex-col gap-4">
              <a
                href="https://aizenworld.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Image
                  alt="AIZEN Logo"
                  width={140}
                  height={36}
                  className="h-8 w-auto object-contain"
                  src="/logo.png"
                />
              </a>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                Đồng hành cùng doanh nghiệp trong kỷ nguyên trí tuệ nhân tạo. Giải pháp tối ưu, hiệu suất đột phá và thực chiến.
              </p>
            </div>

            {/* Cột 2: Thông tin liên hệ (center) */}
            <div className="text-center">
              <h4 className="text-white font-black text-sm uppercase tracking-wider mb-6">THÔNG TIN LIÊN HỆ</h4>
              <ul className="space-y-4 text-left inline-block">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#3b82f6]">location_on</span>
                  <div className="text-sm text-slate-300">112 Lý Phục Man, Phường Tân Thuận, TP. Hồ Chí Minh</div>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#3b82f6]">phone</span>
                  <a href="tel:0362077399" className="text-sm text-slate-400 font-semibold">0362 077 399</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#3b82f6]">mail</span>
                  <a href="mailto:info@aizenworld.com" className="text-sm text-slate-400">info@aizenworld.com</a>
                </li>
              </ul>
            </div>

            {/* Cột 3: Chính sách & liên kết */}
            <div className="text-left">
              <h4 className="text-white font-black text-sm uppercase tracking-wider mb-6">CHÍNH SÁCH & LIÊN KẾT</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ hỗ trợ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Đơn vị tổ chức</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">© 2026 AIZEN World. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors"><span className="material-symbols-outlined">public</span></a>
              <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors"><span className="material-symbols-outlined">person</span></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Zalo Button */}
      <a
        href="https://zalo.me/0362077399"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] flex items-center gap-2 bg-[#0068ff] text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-all active:scale-95 group cursor-pointer"
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

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowRegModal(false); setRegFormState('idle'); }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-[#0c1a2e] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              {/* Close button */}
              <button
                onClick={() => { setShowRegModal(false); setRegFormState('idle'); }}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              {regFormState === 'success' ? (
                /* ── SUCCESS: Show pricing info + QR ── */
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-black font-headline text-white mb-1">Đăng ký thành công!</h3>
                  <p className="text-slate-400 text-sm mb-4">Chúng tôi sẽ sớm liên hệ xác nhận với bạn....</p>

                  {/* Pricing info */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-4 mb-5 text-left">
                    <p className="font-black text-blue-300 text-sm leading-snug">
                      {modalPkg === 'Nhóm 4 người'
                        ? 'Nhóm 4 người, phí đầu tư: 1.300.000 x 4 = 5.200.000, giảm còn 3.960.000'
                        : modalPkg === 'Nhóm 2 người'
                          ? 'Nhóm 2 người, phí đầu tư: 1.300.000 x 2 = 2.600.000, giảm còn 2.200.000'
                          : 'Vui lòng quét mã QR để thanh toán học phí'}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 mx-auto max-w-[260px] shadow-xl">
                    <Image
                      src={getQRImage(modalPkg)}
                      alt={`QR thanh toán ${modalPkg}`}
                      width={260}
                      height={260}
                      className="w-full h-auto rounded-xl"
                    />
                  </div>
                  <p className="text-slate-400 text-xs mt-4 mb-6">Gói: <span className="text-white font-bold">{modalPkg}</span></p>
                  <button
                    onClick={() => { setShowRegModal(false); setRegFormState('idle'); }}
                    className="px-8 py-3 bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] text-[#0e2434] font-black rounded-2xl hover:opacity-90 transition-opacity"
                  >
                    Đã hiểu
                  </button>
                </div>
              ) : (
                /* ── FORM ── */
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-xs font-black tracking-widest text-[#3b82f6] uppercase">Đăng ký tham gia</span>
                    <h3 className="text-2xl font-black font-headline text-white mt-1">{modalPkg}</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {getMemberCount(modalPkg) === 1 ? 'Vui lòng điền thông tin sau:' : `Điền thông tin cho ${getMemberCount(modalPkg)} học viên`}
                    </p>
                  </div>

                  <form onSubmit={handleGroupSubmit} className="space-y-6">
                    <input type="hidden" name="package_type" value={modalPkg} />
                    {/* Honeypot */}
                    <div className="hidden" aria-hidden="true">
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </div>

                    {/* Dynamic member fields */}
                    {Array.from({ length: getMemberCount(modalPkg) }, (_, i) => (
                      <div key={i} className="space-y-3">
                        {getMemberCount(modalPkg) > 1 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                            <span className="text-sm font-bold text-white">Người {i + 1}{i === 0 ? <span className="text-slate-400 font-normal"> · Liên hệ chính</span> : ''}</span>
                          </div>
                        )}

                        {/* Họ tên + SĐT - 2 cột trên desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và tên *</label>
                            <input
                              type="text"
                              name={`fullname_${i + 1}`}
                              required
                              placeholder="Nguyễn Văn A"
                              className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:border-[#3b82f6]/60 focus:outline-none focus:bg-white/8 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại *</label>
                            <input
                              type="tel"
                              name={`phone_${i + 1}`}
                              required
                              placeholder="09xx xxx xxx"
                              className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:border-[#3b82f6]/60 focus:outline-none focus:bg-white/8 transition-all"
                            />
                          </div>
                        </div>

                        {/* Email + Tên công ty - 2 cột trên desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email *</label>
                            <input
                              type="email"
                              name={`email_${i + 1}`}
                              required
                              placeholder="email@example.com"
                              className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:border-[#3b82f6]/60 focus:outline-none focus:bg-white/8 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên công ty</label>
                            <input
                              type="text"
                              name={`company_${i + 1}`}
                              placeholder="Công ty của bạn"
                              className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:border-[#3b82f6]/60 focus:outline-none focus:bg-white/8 transition-all"
                            />
                          </div>
                        </div>

                        {/* Bạn là? + Nguồn tin - 2 cột trên desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bạn là? *</label>
                            <div className="relative">
                              <select
                                name={`role_${i + 1}`}
                                required
                                className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white text-sm focus:border-[#3b82f6]/60 focus:outline-none transition-all appearance-none pr-8"
                                defaultValue=""
                              >
                                <option value="" disabled className="bg-[#0c1a2e] text-slate-400">Chọn vị trí...</option>
                                <option value="Chủ doanh nghiệp" className="bg-[#0c1a2e]">Chủ doanh nghiệp</option>
                                <option value="Quản lý phòng ban" className="bg-[#0c1a2e]">Quản lý phòng ban</option>
                                <option value="Nhân viên" className="bg-[#0c1a2e]">Nhân viên</option>
                                <option value="Sinh viên" className="bg-[#0c1a2e]">Sinh viên</option>
                                <option value="Khác" className="bg-[#0c1a2e]">Khác</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">expand_more</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bạn biết đến chương trình từ đâu *</label>
                            <div className="relative">
                              <select
                                name={`referral_${i + 1}`}
                                required
                                className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white text-sm focus:border-[#3b82f6]/60 focus:outline-none transition-all appearance-none pr-8"
                                defaultValue=""
                              >
                                <option value="" disabled className="bg-[#0c1a2e] text-slate-400">Chọn nguồn...</option>
                                <option value="Cộng Đồng AI ỨNG DỤNG SALE & MARKETING" className="bg-[#0c1a2e]">Cộng Đồng AI ỨNG DỤNG SALE &amp; MARKETING</option>
                                <option value="Khách hàng AIZEN" className="bg-[#0c1a2e]">Khách hàng AIZEN</option>
                                <option value="Người quen giới thiệu" className="bg-[#0c1a2e]">Người quen giới thiệu</option>
                                <option value="Khác" className="bg-[#0c1a2e]">Khác</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">expand_more</span>
                            </div>
                          </div>
                        </div>

                        {getMemberCount(modalPkg) > 1 && i < getMemberCount(modalPkg) - 1 && (
                          <div className="border-b border-white/8 pt-3 pb-3" />
                        )}
                      </div>
                    ))}

                    {/* Error */}
                    {regFormState === 'error' && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        <span className="material-symbols-outlined text-base shrink-0">error</span>
                        {regError}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={regFormState === 'loading'}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] text-[#0e2434] font-black text-base hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {regFormState === 'loading' ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">send</span>
                          Gửi đăng ký
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-500">Chúng tôi sẽ liên hệ xác nhận qua điện thoại trong 24h.</p>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>

  );
}
