'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type FilterBarProps = {
  searchQuery: string;
  statusFilter: string;
  courseFilter: string;
  monthFilter: string;
  distinctCourses: { course: string }[];
  distinctMonths: { cohort_month: string }[];
};

export default function FilterBar({
  searchQuery,
  statusFilter,
  courseFilter,
  monthFilter,
  distinctCourses,
  distinctMonths,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    return `?${params.toString()}`;
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = buildQuery({ course: e.target.value });
    router.push(url);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = buildQuery({ month: e.target.value });
    router.push(url);
  };

  return (
    <>
      {/* Course filter dropdown */}
      <select
        onChange={handleCourseChange}
        defaultValue={courseFilter}
        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a7a5e]/20 focus:border-[#1a7a5e] text-slate-700 cursor-pointer font-medium"
      >
        <option value="">Tất cả khoá học</option>
        {distinctCourses.map((item) => (
          <option key={item.course} value={item.course}>
            {item.course}
          </option>
        ))}
      </select>

      {/* Month filter dropdown */}
      <select
        onChange={handleMonthChange}
        defaultValue={monthFilter}
        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1a7a5e]/20 focus:border-[#1a7a5e] text-slate-700 cursor-pointer font-medium"
      >
        <option value="">Tất cả tháng</option>
        {distinctMonths.map((item) => (
          <option key={item.cohort_month} value={item.cohort_month}>
            {item.cohort_month}
          </option>
        ))}
      </select>
    </>
  );
}
