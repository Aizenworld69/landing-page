export function adjustCourseStatus<T extends { status: string; start_date?: string | null; plans_config?: any }>(course: T): T {
  if (!course) return course;

  let merged: any = course;
  const meta = course.plans_config?._meta || {};
  if (meta.schedule_time || meta.location || meta.location_url || meta.end_date || meta.early_bird_deadline) {
    merged = {
      ...course,
      schedule_time: (course as any).schedule_time ?? meta.schedule_time ?? null,
      location: (course as any).location ?? meta.location ?? null,
      location_url: (course as any).location_url ?? meta.location_url ?? null,
      end_date: (course as any).end_date ?? meta.end_date ?? null,
      early_bird_deadline: (course as any).early_bird_deadline ?? meta.early_bird_deadline ?? null,
    };
  }

  if (merged.status === 'completed' || !merged.start_date) return merged as T;
  const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (merged.start_date.slice(0, 10) < today) return { ...merged, status: 'completed' } as T;
  return merged as T;
}

export function sortCoursesSmart<T extends { status: string; start_date?: string | null }>(courses: T[]): T[] {
  return [...courses].sort((a, b) => {
    const isCompletedA = a.status === 'completed';
    const isCompletedB = b.status === 'completed';

    // 1. Khóa SẮP DIỄN RA (upcoming) đứng ĐẦU, Khóa ĐÃ HOÀN THÀNH (completed) đứng CUỐI
    if (!isCompletedA && isCompletedB) return -1;
    if (isCompletedA && !isCompletedB) return 1;

    // 2. Cùng SẮP DIỄN RA: Xếp theo ngày bắt đầu gần nhất (ascending)
    if (!isCompletedA && !isCompletedB) {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return a.start_date.localeCompare(b.start_date);
    }

    // 3. Cùng ĐÃ HOÀN THÀNH: Xếp theo ngày vừa kết thúc gần nhất (descending)
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return b.start_date.localeCompare(a.start_date);
  });
}
