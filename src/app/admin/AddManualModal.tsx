'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { addManualRegistration } from '@/app/actions';

export default function AddManualModal() {
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

  // Set default registration date to now (local time)
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
      setRegistrationDate(localISOTime);
      
      // Reset logic states
      setPackageType('Standard');
      setMembers(1);
      setAmount(150000);
      setIsAmountManuallyEdited(false);
      setError('');
    }
  }, [isOpen]);

  // Recalculate amount if package or members change, unless manually edited
  useEffect(() => {
    if (!isAmountManuallyEdited) {
      const pricePerPackage = packageType === 'VIP' ? 300000 : 150000;
      setAmount(pricePerPackage * members);
    }
  }, [packageType, members, isAmountManuallyEdited]);

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPackageType(e.target.value);
  };

  const incrementMembers = () => {
    setMembers((prev) => prev + 1);
  };

  const decrementMembers = () => {
    setMembers((prev) => (prev > 1 ? prev - 1 : 1));
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
    
    // Explicitly add members and registration date in case counter field is handled by custom buttons
    formData.set('members', members.toString());

    startTransition(async () => {
      const res = await addManualRegistration(formData);
      if (res.success) {
        setIsOpen(false);
        formRef.current?.reset();
      } else {
        setError(res.error || 'Có lỗi xảy ra.');
      }
    });
  };

  return (
    <>
      {/* Nút mở modal */}
      <button
        id="add-manual-btn"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#1a7a5e] hover:bg-[#135c46] text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Thêm thủ công
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
                <h2 className="font-bold text-slate-900 text-lg">Thêm thủ công</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng điền đầy đủ thông tin để đăng ký thành viên mới vào workshop.
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
                  <span className="material-symbols-outlined text-[#1a7a5e] text-[20px]">person</span>
                  <span className="text-xs font-bold text-[#1a7a5e] uppercase tracking-wider">
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
                      disabled={isPending}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
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
                      disabled={isPending}
                      placeholder="09xx xxx xxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
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
                      disabled={isPending}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Công ty
                    </label>
                    <input
                      name="company"
                      type="text"
                      disabled={isPending}
                      placeholder="Tên công ty"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Chi tiết đăng ký */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="material-symbols-outlined text-[#1a7a5e] text-[20px]">receipt_long</span>
                  <span className="text-xs font-bold text-[#1a7a5e] uppercase tracking-wider">
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all font-medium cursor-pointer"
                    >
                      <option value="Standard">Standard (150k)</option>
                      <option value="VIP">VIP (300k)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Thành viên (Members)
                    </label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-[42px] px-2 overflow-hidden focus-within:bg-white focus-within:border-[#1a7a5e] focus-within:ring-2 focus-within:ring-[#1a7a5e]/10 transition-all">
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
                        className="w-full pl-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all font-bold"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* TRẠNG THÁI THANH TOÁN */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Trạng thái CK
                  </label>
                  <select
                    name="payment_status"
                    disabled={isPending}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#1a7a5e] focus:ring-2 focus:ring-[#1a7a5e]/10 disabled:opacity-60 transition-all font-semibold cursor-pointer"
                  >
                    <option value="UNPAID">UNPAID (Chưa thanh toán)</option>
                    <option value="PAID">PAID (Đã thanh toán)</option>
                  </select>
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-[#1a7a5e] hover:bg-[#135c46] text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#1a7a5e]/10"
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
                    'Thêm ngay'
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
