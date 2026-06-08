'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { updatePaymentStatus } from '@/app/actions';

interface PaymentToggleProps {
  id: number;
  currentStatus: 'PAID' | 'UNPAID';
}

const OPTIONS = [
  {
    value: 'PAID' as const,
    label: 'Đã thanh toán',
    icon: 'check_circle',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    value: 'UNPAID' as const,
    label: 'Chưa thanh toán',
    icon: 'radio_button_unchecked',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
];

export default function PaymentToggle({ id, currentStatus }: PaymentToggleProps) {
  const [status, setStatus] = useState<'PAID' | 'UNPAID'>(currentStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.value === status) ?? OPTIONS[1];

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newStatus: 'PAID' | 'UNPAID') => {
    if (newStatus === status || isPending) return;
    setIsOpen(false);

    startTransition(async () => {
      const res = await updatePaymentStatus(id, newStatus);
      if (res.success) {
        setStatus(newStatus);
      } else {
        alert(res.error ?? 'Có lỗi xảy ra khi cập nhật trạng thái.');
      }
    });
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger button */}
      <button
        onClick={() => !isPending && setIsOpen((v) => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full text-xs font-bold border transition-all select-none
          ${current.bg} ${current.border} ${current.color}
          ${isPending ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm hover:brightness-95 cursor-pointer'}
        `}
      >
        {isPending ? (
          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span className="material-symbols-outlined text-[15px]">{current.icon}</span>
        )}
        <span>{current.label}</span>
        <span className={`material-symbols-outlined text-[14px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && !isPending && (
        <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[170px]">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold transition-colors text-left
                ${status === opt.value ? `${opt.bg} ${opt.color}` : 'text-slate-700 hover:bg-slate-50'}
              `}
            >
              {/* Dot indicator */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
              <span className="material-symbols-outlined text-[15px]">{opt.icon}</span>
              {opt.label}
              {status === opt.value && (
                <span className="material-symbols-outlined text-[14px] ml-auto">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
