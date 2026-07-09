'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { updateRegistration } from '@/app/actions';

type Registration = {
  id: number;
  fullname: string;
  phone: string;
  email: string;
  company: string;
  payment_content: string | null;
  amount: number;
  members: number;
  package_type: string;
  created_at: string;
  payment_status: 'PAID' | 'UNPAID';
  course?: string;
  cohort_month?: string;
  voucher_code?: string;
};

interface CourseOption {
  course: string;
}

interface EditModalProps {
  registration: Registration;
  coursesList?: CourseOption[];
}

const formatDbDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr.replace(' ', 'T').substring(0, 16);
};

export default function EditModal({ registration: reg, coursesList = [] }: EditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Form states for dynamic logic
  const [packageType, setPackageType] = useState('Standard');
  const [members, setMembers] = useState(1);
  const [amount, setAmount] = useState(150000);
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);
  const [registrationDate, setRegistrationDate] = useState('');

  const openModal = () => {
    setPackageType(reg.package_type || 'Standard');
    setMembers(reg.members || 1);
    setAmount(reg.amount ?? 150000);
    setIsAmountManuallyEdited(false);
    setRegistrationDate(formatDbDateForInput(reg.created_at));
    setError('');
    setIsOpen(true);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPkg = e.target.value;
    setPackageType(nextPkg);
    if (!isAmountManuallyEdited) {
      const pricePerPackage = nextPkg === 'VIP' ? 300000 : 150000;
      setAmount(pricePerPackage * members);
    }
  };

  const incrementMembers = () => {
    const nextMembers = members + 1;
    setMembers(nextMembers);
    if (!isAmountManuallyEdited) {
      const pricePerPackage = packageType === 'VIP' ? 300000 : 150000;
      setAmount(pricePerPackage * nextMembers);
    }
  };

  const decrementMembers = () => {
    const nextMembers = members > 1 ? members - 1 : 1;
    setMembers(nextMembers);
    if (!isAmountManuallyEdited) {
      const pricePerPackage = packageType === 'VIP' ? 300000 : 150000;
      setAmount(pricePerPackage * nextMembers);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAmountManuallyEdited(true);
    const val = parseInt(e.target.value, 10);
    setAmount(isNaN(val) ? 0 : val);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    formData.set('members', members.toString());

    startTransition(async () => {
      const res = await updateRegistration(reg.id, formData);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error ?? 'Có lỗi xảy ra.');
      }
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openModal}
        title="Chỉnh sửa thông tin khách hàng"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[15px]">edit</span>
        Sửa
      </button>

      {/* Backdrop + Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Modal card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh] text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Chỉnh sửa thông tin</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: #{reg.id} — Cập nhật thông tin đăng ký của khách hàng.
                </p>
              </div>
              <button
                onClick={() => !isPending && setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-600">close</span>
              </button>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto"
            >
              {/* SECTION 1: Thông tin cá nhân */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">person</span>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Thông tin cá nhân
                  </span>
                </div>

                {/* HỌ TÊN & SĐT */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="fullname"
                      type="text"
                      required
                      defaultValue={reg.fullname}
                      disabled={isPending}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      SĐT <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      defaultValue={reg.phone}
                      disabled={isPending}
                      placeholder="09xx xxx xxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* EMAIL & CÔNG TY */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={reg.email}
                      disabled={isPending}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Công ty
                    </label>
                    <input
                      name="company"
                      type="text"
                      defaultValue={reg.company}
                      disabled={isPending}
                      placeholder="Tên công ty"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Chi tiết đăng ký */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">receipt_long</span>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Chi tiết đăng ký
                  </span>
                </div>

                {/* GÓI (PACKAGE) & THÀNH VIÊN */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Gói (Package) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="package_type"
                      value={packageType}
                      onChange={handlePackageChange}
                      disabled={isPending}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-medium cursor-pointer"
                    >
                      <option value="Standard">Standard (150k)</option>
                      <option value="VIP">VIP (300k)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Thành viên (Members)
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-[42px] px-2 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                      <button
                        type="button"
                        onClick={decrementMembers}
                        disabled={isPending || members <= 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-colors text-slate-600 font-bold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={members}
                        className="flex-1 text-center bg-transparent border-none outline-none text-sm text-slate-900 font-bold"
                      />
                      <button
                        type="button"
                        onClick={incrementMembers}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-colors text-slate-600 font-bold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SỐ TIỀN & NGÀY ĐK */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Số tiền <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        value={amount}
                        onChange={handleAmountChange}
                        disabled={isPending}
                        className="w-full pl-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-bold"
                      />
                      <span className="absolute right-3.5 text-xs font-black text-slate-400 tracking-wider">
                        VND
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Ngày ĐK
                    </label>
                    <input
                      name="created_at"
                      type="datetime-local"
                      value={registrationDate}
                      onChange={(e) => setRegistrationDate(e.target.value)}
                      disabled={isPending}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* MÃ NỘI DUNG CK & TRẠNG THÁI CK */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Mã nội dung CK
                    </label>
                    <input
                      name="payment_content"
                      type="text"
                      defaultValue={reg.payment_content ?? ''}
                      disabled={isPending}
                      placeholder="WS3_NVA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Trạng thái CK
                    </label>
                    <select
                      name="payment_status"
                      defaultValue={reg.payment_status || 'UNPAID'}
                      disabled={isPending}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-semibold cursor-pointer"
                    >
                      <option value="UNPAID">UNPAID (Chưa đóng)</option>
                      <option value="PAID">PAID (Đã đóng)</option>
                    </select>
                  </div>
                </div>

                {/* KHOÁ HỌC & THÁNG KHAI GIẢNG */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Khoá học
                    </label>
                    <select
                      name="course"
                      defaultValue={reg.course || ''}
                      disabled={isPending}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-medium cursor-pointer"
                    >
                      <option value="">-- Chọn khoá học --</option>
                      {coursesList.map((c) => (
                        <option key={c.course} value={c.course}>
                          {c.course}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Tháng khai giảng
                    </label>
                    <input
                      name="cohort_month"
                      type="month"
                      defaultValue={reg.cohort_month || ''}
                      disabled={isPending}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* MÀ VOUCHER */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Mã giảm giá (Voucher)
                  </label>
                  <input
                    name="voucher_code"
                    type="text"
                    defaultValue={reg.voucher_code || ''}
                    disabled={isPending}
                    placeholder="Không sử dụng voucher"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 transition-all font-bold uppercase"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">
                    error
                  </span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => !isPending && setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">save</span>
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
