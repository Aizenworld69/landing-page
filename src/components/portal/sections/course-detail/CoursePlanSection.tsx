'use client';

import { motion } from 'framer-motion';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/portal/utils/format';
import { createRegistration, createGroupRegistration, validatePromoCode, type PromoValidateResult } from '@/lib/portal/api/registrations.api';

// ─── Types ────────────────────────────────────────────
interface CoursePlanSectionProps {
  courseId: string;
  courseTitle: string;
  courseStatus?: string;
  price: number;
  priceGroup: number;
  qrEarlyBird?: string;
  qrIndividual?: string;
  qrGroup2?: string;
  qrGroup4?: string;
  /** QR sau khuyến mãi — nếu có thì hiển thị thay QR gốc */
  qrEarlyBirdPromo?: string;
  qrIndividualPromo?: string;
  qrGroup2Promo?: string;
  qrGroup4Promo?: string;
  plansConfig?: Record<string, { price?: number; label?: string; sublabel?: string }>;
  earlyBirdDeadline?: string | null;
}

type PlanKey = 'early_bird' | 'individual' | 'group_2' | 'group_4';

interface PlanConfig {
  key: PlanKey;
  label: string;
  sublabel: string;
  pricePerPerson: number;
  totalPrice: number;
  originalTotal: number;
  memberCount: number;
  badge?: { text: string; color: string };
  icon: React.ReactNode;
  buttonLabel: string;
}

interface MemberForm {
  fullName: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  referral: string;
}

interface MemberErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  referral?: string;
}

const REFERRAL_SOURCES = [
  'Cộng Đồng AI ỨNG DỤNG SALE & MARKETING',
  'Khách hàng AIZEN',
  'Người quen giới thiệu',
  'Facebook / Instagram',
  'Khác',
];

const POSITION_OPTIONS = [
  'Chủ doanh nghiệp / CEO',
  'Giám đốc / C-level',
  'Trưởng phòng / Manager',
  'Team Lead',
  'Chuyên viên / Nhân viên',
  'Freelancer / Tự kinh doanh',
  'Sinh viên',
  'Khác',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyMember = (): MemberForm => ({
  fullName: '', phone: '', email: '', company: '', position: '', referral: '',
});
const emptyErrors = (): MemberErrors => ({});

// ─── Icon helpers ─────────────────────────────────────
const IconUser = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconBolt = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// ─── Dark input ───────────────────────────────────────
interface DarkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
function DarkInput({ label, error, id, required, ...props }: DarkInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-300">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input id={id} {...props}
        style={{ color: '#ffffff', caretColor: '#ffffff' }}
        className={`w-full px-3 py-2 rounded-lg border bg-slate-700/60 text-white text-sm placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition-colors ${
          error ? 'border-red-400/60' : 'border-white/15 hover:border-white/25'
        }`} />
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Dark select ──────────────────────────────────────
interface DarkSelectProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  onChange: (v: string) => void;
}
function DarkSelect({ id, label, value, options, placeholder = 'Chọn...', required, error, onChange }: DarkSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-300">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ color: value === '' ? 'rgb(100,116,139)' : '#ffffff' }}
          className={`w-full appearance-none px-3 py-2 pr-8 border rounded-lg bg-slate-700/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition-colors ${
            error ? 'border-red-400/60' : 'border-white/15 hover:border-white/25'
          } ${value === '' ? 'text-slate-500' : 'text-white'}`}>
          <option value="" disabled className="bg-slate-900">{placeholder}</option>
          {options.map((o) => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Registration Modal ───────────────────────────────
interface RegistrationModalProps {
  plan: PlanConfig;
  courseId: string;
  courseTitle: string;
  qrNormalUrl?: string;
  qrPromoUrl?: string;
  onClose: () => void;
}

function RegistrationModal({ plan, courseId, courseTitle, qrNormalUrl, qrPromoUrl, onClose }: RegistrationModalProps) {
  const [members, setMembers] = useState<MemberForm[]>(
    Array.from({ length: plan.memberCount }, emptyMember),
  );
  const [memberErrors, setMemberErrors] = useState<MemberErrors[]>(
    Array.from({ length: plan.memberCount }, emptyErrors),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // States cho mã khuyến mãi
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoValidateResult | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC to close
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function updateMember(idx: number, field: keyof MemberForm, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
    const errorFields: (keyof MemberErrors)[] = ['fullName', 'phone', 'email', 'referral'];
    if (errorFields.includes(field as keyof MemberErrors)) {
      setMemberErrors((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: undefined } : e)));
    }
  }

  function validate(): boolean {
    let valid = true;
    const errors = members.map((m) => {
      const e: MemberErrors = {};
      if (!m.fullName.trim()) { e.fullName = 'Vui lòng nhập họ tên'; valid = false; }
      if (!m.phone.trim()) { e.phone = 'Vui lòng nhập số điện thoại'; valid = false; }
      if (!m.email.trim()) { e.email = 'Vui lòng nhập email'; valid = false; }
      else if (!EMAIL_REGEX.test(m.email)) { e.email = 'Email không hợp lệ'; valid = false; }
      if (!m.referral) { e.referral = 'Vui lòng chọn nguồn'; valid = false; }
      return e;
    });
    setMemberErrors(errors);
    return valid;
  }

  async function handleApplyPromo() {
    if (!promoCodeInput.trim()) return;
    setIsCheckingPromo(true);
    setPromoError(null);
    setAppliedPromo(null);
    try {
      const result = await validatePromoCode(
        promoCodeInput.trim().toUpperCase(),
        courseId,
        plan.key,
      );
      if (result.valid) {
        setAppliedPromo(result);
      } else {
        setPromoError(result.message);
      }
    } catch (err) {
      setPromoError('Không thể kiểm tra mã khuyến mãi, vui lòng thử lại.');
    } finally {
      setIsCheckingPromo(false);
    }
  }

  function handleRemovePromo() {
    setPromoCodeInput('');
    setAppliedPromo(null);
    setPromoError(null);
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsLoading(true);
    setApiError(null);
    const promoCode = appliedPromo ? promoCodeInput.trim().toUpperCase() : undefined;
    try {
      if (plan.memberCount === 1) {
        const m = members[0]!;
        await createRegistration({
          courseId, plan: plan.key === 'early_bird' ? 'individual' : 'individual',
          fullName: m.fullName, phone: m.phone, email: m.email,
          company: m.company || undefined, position: m.position || undefined,
          referral: m.referral,
          promoCode,
        });
      } else {
        await createGroupRegistration({
          courseId,
          referral: members[0]!.referral, // primary referral from first member
          members: members.map((m) => ({
            fullName: m.fullName, phone: m.phone, email: m.email,
            company: m.company || undefined, position: m.position || undefined,
          })),
          promoCode,
        });
      }
      setSuccess(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Đăng ký thất bại, thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }

  // Tính giá sau giảm
  const discountFromPlan = plan.originalTotal - plan.totalPrice;
  let discountFromPromo = 0;

  if (appliedPromo?.valid && appliedPromo.discount_type && appliedPromo.discount_value) {
    if (appliedPromo.discount_type === 'percent') {
      discountFromPromo = Math.round((plan.totalPrice * appliedPromo.discount_value) / 100);
    } else {
      discountFromPromo = Math.min(appliedPromo.discount_value, plan.totalPrice);
    }
  }

  const finalPrice = Math.max(0, plan.totalPrice - discountFromPromo);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundImage: "linear-gradient(180deg, rgba(15,30,53,0.75) 0%, rgba(11,22,40,0.8) 100%), url('/backgoundTrangkhoahoc.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/8">
          <p className="text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-1">ĐĂNG KÝ THAM GIA</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">{plan.label}</h2>
              {plan.memberCount > 1 && (
                <p className="text-slate-400 text-sm mt-0.5">
                  Điền thông tin cho {plan.memberCount} học viên
                </p>
              )}
              <p className="text-slate-500 text-xs mt-1">📚 {courseTitle}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {success ? (
            <div className="text-center py-6 flex flex-col items-center">
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-white font-bold text-lg mb-1">Đăng ký thành công!</p>
              <p className="text-slate-300 text-sm mb-4">Vui lòng quét mã QR dưới đây để hoàn tất thanh toán học phí:</p>
              
              {appliedPromo && qrPromoUrl ? (
                <div className="bg-white p-3 rounded-2xl border border-white/10 shadow-lg max-w-[240px] w-full aspect-square flex items-center justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrPromoUrl}
                    alt="Mã QR Thanh toán (Khuyến mãi)"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              ) : qrNormalUrl ? (
                <div className="bg-white p-3 rounded-2xl border border-white/10 shadow-lg max-w-[240px] w-full aspect-square flex items-center justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrNormalUrl}
                    alt="Mã QR Thanh toán"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <p className="text-slate-400 text-xs mb-4 italic">Không có hình ảnh QR thanh toán nào được thiết lập. Ban hỗ trợ sẽ liên hệ với bạn trong 24h.</p>
              )}

              <p className="text-sky-400 text-xs font-semibold mb-6">Chúng tôi sẽ xác nhận đăng ký và liên hệ với bạn qua SĐT/Email trong 24h.</p>

              <button onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors cursor-pointer">
                Xác nhận & Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Person forms */}
              {members.map((member, idx) => (
                <div key={idx}
                  className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                  {/* Person label */}
                  {plan.memberCount > 1 && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-white">Người {idx + 1}</p>
                    </div>
                  )}

                  {/* Row 1: Name + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DarkInput id={`fullName_${idx}`} label="Họ và Tên" placeholder="Nguyễn Văn A"
                      value={member.fullName} error={memberErrors[idx]?.fullName} required
                      onChange={(e) => updateMember(idx, 'fullName', e.target.value)} />
                    <DarkInput id={`phone_${idx}`} label="Số điện thoại" placeholder="090 xxx xxx"
                      type="tel" value={member.phone} error={memberErrors[idx]?.phone} required
                      onChange={(e) => updateMember(idx, 'phone', e.target.value)} />
                  </div>

                  {/* Row 2: Email + Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DarkInput id={`email_${idx}`} label="Email" placeholder="email@example.com"
                      type="email" value={member.email} error={memberErrors[idx]?.email} required
                      onChange={(e) => updateMember(idx, 'email', e.target.value)} />
                    <DarkInput id={`company_${idx}`} label="Tên Công Ty" placeholder="Công ty của bạn"
                      value={member.company}
                      onChange={(e) => updateMember(idx, 'company', e.target.value)} />
                  </div>

                  {/* Row 3: Position + Referral */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DarkSelect id={`position_${idx}`} label="Chức vụ" value={member.position}
                      options={POSITION_OPTIONS} placeholder="Chọn vị trí..."
                      onChange={(v) => updateMember(idx, 'position', v)} />
                    <DarkSelect id={`referral_${idx}`} label="Bạn biết đến chương trình từ đâu"
                      value={member.referral} options={REFERRAL_SOURCES}
                      placeholder="Chọn nguồn..." required
                      error={memberErrors[idx]?.referral}
                      onChange={(v) => updateMember(idx, 'referral', v)} />
                  </div>
                </div>
              ))}

              {/* Promo Code Input */}
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
                <label htmlFor="promo-code-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  🎟️ Có mã khuyến mãi? <span className="text-slate-500 font-normal">(Không bắt buộc)</span>
                </label>

                {appliedPromo ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-emerald-300 text-sm font-bold tracking-wider">{promoCodeInput.trim().toUpperCase()}</p>
                        <p className="text-emerald-400/80 text-xs">
                          {appliedPromo.discount_type === 'percent'
                            ? `Đã áp dụng giảm ${appliedPromo.discount_value}%`
                            : `Đã áp dụng giảm ${formatCurrency(appliedPromo.discount_value ?? 0)}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="promo-code-input"
                      type="text"
                      placeholder="Ví dụ: AIZEN50"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        setPromoError(null);
                      }}
                      style={{ color: '#ffffff', caretColor: '#ffffff' }}
                      className="flex-1 px-3 py-2 rounded-lg border border-white/15 bg-slate-700/60 text-white text-sm placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500/60 tracking-wider font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={isCheckingPromo || !promoCodeInput.trim()}
                      className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {isCheckingPromo ? (
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : 'Áp dụng'}
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {promoError}
                  </p>
                )}
              </div>

              {/* Price summary */}
              <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Giá gốc:</span>
                  <span className="text-slate-500 line-through">{formatCurrency(plan.originalTotal)}</span>
                </div>
                {discountFromPlan > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Giảm giá ({plan.label}):</span>
                    <span className="text-emerald-400 font-semibold">-{formatCurrency(discountFromPlan)}</span>
                  </div>
                )}
                {discountFromPromo > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      🎟️ Mã KM ({promoCodeInput.trim().toUpperCase()}):
                    </span>
                    <span className="text-emerald-400 font-semibold">-{formatCurrency(discountFromPromo)}</span>
                  </div>
                )}
                <div className="border-t border-white/8 pt-2 flex justify-between items-center">
                  <span className="text-white font-semibold text-sm">Tổng thanh toán:</span>
                  <span className="text-sky-300 font-extrabold text-lg">{formatCurrency(finalPrice)}</span>
                </div>
              </div>

              {apiError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
                  {apiError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer — submit button */}
        {!success && (
          <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-white/8 space-y-2">
            <button onClick={handleSubmit} disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Đang xử lý...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>Gửi đăng ký</>
              )}
            </button>
            <p className="text-center text-xs text-slate-500">
              Chúng tôi sẽ liên hệ với bạn qua điện thoại trong 24h.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return '';
  }
}

// ─── Plan Card ────────────────────────────────────────
interface PlanCardProps {
  plan: PlanConfig;
  disabled?: boolean;
  disabledReason?: string;
  earlyBirdDeadline?: string | null;
  onClick: () => void;
}

function PlanCard({ plan, disabled, disabledReason = 'Đã hết hạn đăng ký', earlyBirdDeadline, onClick }: PlanCardProps) {
  const isEarlyBird = plan.key === 'early_bird';
  const isGroup4 = plan.key === 'group_4';
  const isGroup2 = plan.key === 'group_2';

  const getBadgeGradient = () => {
    if (plan.badge?.color.includes('amber')) return 'linear-gradient(90deg, #d97706, #f59e0b)';
    if (plan.badge?.color.includes('emerald')) return 'linear-gradient(90deg, #059669, #10b981)';
    return 'linear-gradient(90deg, #0284c7, #0ea5e9)';
  };

  const getCardBorder = () => {
    if (isEarlyBird) return 'rgba(245,158,11,0.2)';
    if (isGroup4) return 'rgba(16,185,129,0.3)';
    if (isGroup2) return 'rgba(14,165,233,0.3)';
    return 'rgba(255,255,255,0.1)';
  };

  const getCardGlow = () => {
    if (isGroup4) return '0 8px 24px rgba(16,185,129,0.12)';
    if (isGroup2) return '0 8px 24px rgba(14,165,233,0.12)';
    return 'none';
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-visible h-full ${
        disabled ? 'opacity-50 grayscale select-none cursor-not-allowed pointer-events-none' : 'cursor-pointer group'
      }`}
      style={{
        background: disabled
          ? 'rgba(15,25,40,0.6)'
          : 'rgba(15,28,48,0.85)',
        border: `1px solid ${getCardBorder()}`,
        boxShadow: getCardGlow(),
        backdropFilter: 'blur(8px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        minHeight: 340,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-6px)';
        if (isGroup4) el.style.boxShadow = '0 16px 36px rgba(16,185,129,0.25)';
        else if (isGroup2) el.style.boxShadow = '0 16px 36px rgba(244,63,94,0.25)';
        else el.style.boxShadow = '0 16px 36px rgba(14,165,233,0.2)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = getCardGlow();
      }}
    >
      <div className="flex flex-col flex-1 p-6 pt-7">
      {/* Top Floating Badge Pill */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span
            className={`px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-white rounded-full shadow-md border border-white/20 ${
              isGroup2
                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 shadow-red-500/40'
                : isGroup4
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-emerald-500/40'
                : ''
            }`}
            style={{
              background: (!isGroup2 && !isGroup4) ? getBadgeGradient() : undefined,
            }}
          >
            {plan.badge.text}
          </span>
        </div>
      )}

        {/* Dynamic Badge Pill Tags */}
        {isEarlyBird && earlyBirdDeadline && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-950 bg-amber-400 rounded-full border border-amber-300 shadow-sm shadow-amber-400/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
              Đến {formatDate(earlyBirdDeadline)}
            </span>
          </div>
        )}
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{
            background: isEarlyBird
              ? 'rgba(245,158,11,0.12)'
              : isGroup4
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(14,165,233,0.12)',
          }}
        >
          {plan.icon}
        </div>

        {/* Name */}
        <p className="font-black text-white text-base mb-0.5 tracking-tight">{plan.label}</p>
        <p className="text-slate-500 text-xs mb-4">{plan.sublabel}</p>

        {/* Price */}
        <div className="mt-auto">
          {plan.originalTotal > plan.totalPrice && (
            <p className="text-slate-600 line-through text-xs mb-0.5">
              {formatCurrency(plan.originalTotal)}
            </p>
          )}
          <p
            className="font-black text-xl mb-4 leading-tight"
            style={{
              color: isEarlyBird
                ? '#fcd34d'
                : isGroup4
                ? '#34d399'
                : '#f8fafc',
            }}
          >
            {formatCurrency(plan.totalPrice)}
          </p>

          {disabled ? (
            <div className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-bold text-center">
              {disabledReason}
            </div>
          ) : (
            <button
              className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: isGroup4
                  ? 'linear-gradient(90deg, #059669, #10b981)'
                  : 'linear-gradient(90deg, #0284c7, #0ea5e9)',
                boxShadow: isGroup4
                  ? '0 4px 12px rgba(16,185,129,0.3)'
                  : '0 4px 12px rgba(14,165,233,0.3)',
              }}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              {plan.buttonLabel}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────
export function CoursePlanSection({
  courseId,
  courseTitle,
  courseStatus,
  price,
  priceGroup,
  qrEarlyBird,
  qrIndividual,
  qrGroup2,
  qrGroup4,
  qrEarlyBirdPromo,
  qrIndividualPromo,
  qrGroup2Promo,
  qrGroup4Promo,
  plansConfig,
  earlyBirdDeadline,
}: CoursePlanSectionProps) {
  const earlyBirdPrice = plansConfig?.early_bird?.price ?? price;
  const earlyBirdLabel = plansConfig?.early_bird?.label || 'Early Bird';
  const earlyBirdSublabel = plansConfig?.early_bird?.sublabel || '1 người · Ưu đãi có hạn';

  const plansList = plansConfig || {};
  const isExpired = earlyBirdDeadline ? new Date(earlyBirdDeadline) < new Date() : false;
  const isCompleted = courseStatus === 'completed';

  const individualPrice = plansConfig?.individual?.price ?? price;
  const individualLabel = plansConfig?.individual?.label || '1 người';
  const individualSublabel = plansConfig?.individual?.sublabel || 'Đăng ký cá nhân';

  const group2PricePerPerson = plansConfig?.group_2?.price ?? priceGroup;
  const group2Label = plansConfig?.group_2?.label || 'Nhóm 2 người';
  const group2Sublabel = plansConfig?.group_2?.sublabel || `${formatCurrency(group2PricePerPerson)}/người`;

  const group4Total = plansConfig?.group_4?.price ?? (priceGroup * 4);
  const group4Label = plansConfig?.group_4?.label || 'Nhóm 4 người';
  const group4Sublabel = plansConfig?.group_4?.sublabel || `${formatCurrency(Math.round(group4Total / 4))}/người`;

  const PLANS: PlanConfig[] = [
    {
      key: 'early_bird',
      label: earlyBirdLabel,
      sublabel: earlyBirdSublabel,
      pricePerPerson: earlyBirdPrice,
      totalPrice: earlyBirdPrice,
      originalTotal: price,
      memberCount: 1,
      badge: { text: 'SỐ LƯỢNG CÓ HẠN', color: 'bg-amber-500' },
      icon: <IconBolt className="w-5 h-5 text-amber-400" />,
      buttonLabel: 'Đăng ký ngay',
    },
    {
      key: 'individual',
      label: individualLabel,
      sublabel: individualSublabel,
      pricePerPerson: individualPrice,
      totalPrice: individualPrice,
      originalTotal: price,
      memberCount: 1,
      icon: <IconUser className="w-5 h-5 text-sky-400" />,
      buttonLabel: 'Đăng ký ngay',
    },
    {
      key: 'group_2',
      label: group2Label,
      sublabel: group2Sublabel,
      pricePerPerson: group2PricePerPerson,
      totalPrice: group2PricePerPerson * 2,
      originalTotal: price * 2,
      memberCount: 2,
      badge: { text: 'HOT NHẤT', color: 'bg-sky-500' },
      icon: <IconUsers className="w-5 h-5 text-sky-400" />,
      buttonLabel: 'Đăng ký ngay',
    },
    {
      key: 'group_4',
      label: group4Label,
      sublabel: group4Sublabel,
      pricePerPerson: Math.round(group4Total / 4),
      totalPrice: group4Total,
      originalTotal: price * 4,
      memberCount: 4,
      badge: { text: 'TIẾT KIỆM NHẤT', color: 'bg-emerald-500' },
      icon: <IconUsers className="w-5 h-5 text-emerald-400" />,
      buttonLabel: 'Đăng ký nhóm',
    },
  ];

  const [activePlan, setActivePlan] = useState<PlanConfig | null>(null);

  return (
    <>
      <section id="dang-ky" className="py-12">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-[#38bdf8] uppercase mb-3">
            <span className="w-6 h-px bg-[#38bdf8]/60" />
            ĐĂNG KÝ NGAY
            <span className="w-6 h-px bg-[#38bdf8]/60" />
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Chọn hình thức{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#3b82f6]">
              đăng ký
            </span>
          </h2>
        </motion.div>

        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-center text-sm font-bold backdrop-blur-md flex items-center justify-center gap-2 shadow-xl"
          >
            <span className="text-lg">🔒</span>
            <span>Khóa học này đã hoàn thành. Hiện tại hệ thống đã đóng cổng nhận đăng ký mới!</span>
          </motion.div>
        )}

        {/* 4 plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <PlanCard
                plan={plan}
                disabled={isCompleted || (plan.key === 'early_bird' && isExpired)}
                disabledReason={isCompleted ? 'Đã hoàn thành · Đóng đăng ký' : 'Đã hết hạn đăng ký'}
                earlyBirdDeadline={earlyBirdDeadline}
                onClick={() => setActivePlan(plan)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {activePlan && (
        <RegistrationModal
          plan={activePlan}
          courseId={courseId}
          courseTitle={courseTitle}
          qrNormalUrl={
            activePlan.key === 'early_bird'
              ? qrEarlyBird
              : activePlan.key === 'individual'
              ? qrIndividual
              : activePlan.key === 'group_2'
              ? qrGroup2
              : qrGroup4
          }
          qrPromoUrl={
            activePlan.key === 'early_bird'
              ? qrEarlyBirdPromo
              : activePlan.key === 'individual'
              ? qrIndividualPromo
              : activePlan.key === 'group_2'
              ? qrGroup2Promo
              : qrGroup4Promo
          }
          onClose={() => setActivePlan(null)}
        />
      )}
    </>
  );
}
