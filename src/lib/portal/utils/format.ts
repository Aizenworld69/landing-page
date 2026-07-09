import { format, differenceInDays, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: vi });
}

export function formatDateLong(date: string | Date): string {
  return format(new Date(date), "EEEE, dd 'tháng' MM 'năm' yyyy", { locale: vi });
}

/** Format kieu "17 Tháng 03, 2026" - dung cho blog */
export function formatDateBlog(date: string | Date): string {
  return format(new Date(date), "dd 'Tháng' MM, yyyy", { locale: vi });
}

export function getDaysUntil(date: string | Date): number {
  return Math.max(0, differenceInDays(new Date(date), new Date()));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isCourseStarted(date: string | null): boolean {
  if (!date) return false;
  return isPast(new Date(date));
}
