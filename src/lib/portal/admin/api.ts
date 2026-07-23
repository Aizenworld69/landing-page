import { getAdminToken } from './auth';

const BASE = (typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:20000/api')
).replace(/\/$/, '');

// ── Response shape từ ResponseTransformInterceptor ────
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  statusCode: number;
  timestamp: string;
  message?: string;
}

interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  let json: unknown;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    const err = json as ApiError;
    const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? `Lỗi ${res.status}`);
    throw new Error(msg);
  }

  // Unwrap envelope { success, data, statusCode, timestamp }
  const envelope = json as ApiEnvelope<T>;
  return envelope.data !== undefined ? envelope.data : (json as T);
}

// ── Auth ──────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
  };
}

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let json: unknown;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    const err = json as ApiError;
    const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? 'Đăng nhập thất bại');
    throw new Error(msg);
  }

  // Unwrap envelope nếu có
  const envelope = json as ApiEnvelope<LoginResponse>;
  const payload = envelope.data ?? (json as LoginResponse);

  if (!payload.accessToken) {
    throw new Error('Server không trả về token');
  }
  return payload;
}

// ── Registrations ─────────────────────────────────────
export interface Registration {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
  referral: string;
  plan: string;
  group_id?: string | null;
  promo_code?: string | null;
  discount_amount?: number | null;
  created_at: string;
  course_id: string;
  courses?: { title: string; price?: number; price_group?: number } | null;
}

export interface RegistrationsPage {
  data: Registration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getRegistrations(params: {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
}): Promise<RegistrationsPage> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.courseId) q.set('courseId', params.courseId);
  return adminFetch<RegistrationsPage>(`/registrations?${q.toString()}`);
}

export interface AdminStats {
  total: number;
  today: number;
  byCourse: { courseId: string; title: string; count: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  return adminFetch<AdminStats>('/registrations/stats');
}

// ── Courses ───────────────────────────────────────────
export type CourseStatus = 'upcoming' | 'completed';

export type PlanConfigItem = { price?: number; label?: string; sublabel?: string; [key: string]: unknown };
export type PlansConfigMap = Record<string, PlanConfigItem>;

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url?: string | null;
  status: CourseStatus;
  category: string;
  start_date?: string | null;
  schedule_time?: string | null;
  location?: string | null;
  location_url?: string | null;
  price: number;
  price_group: number;
  instructor_id: string;
  skills?: { title: string; description: string; badge?: string }[] | null;
  curriculum_headline?: string | null;
  qr_early_bird?: string | null;
  qr_individual?: string | null;
  qr_group_2?: string | null;
  qr_group_4?: string | null;
  qr_early_bird_promo?: string | null;
  qr_individual_promo?: string | null;
  qr_group_2_promo?: string | null;
  qr_group_4_promo?: string | null;
  early_bird_deadline?: string | null;
  plans_config?: PlansConfigMap | null;
  created_at: string;
  instructors?: { id: string; name: string } | null;
}

/** Promo đang active trả về từ GET /api/promo-codes/active */
export interface ActivePromoInfo {
  plan: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
}
export type ActivePromoMap = Partial<Record<'early_bird' | 'individual' | 'group_2' | 'group_4', ActivePromoInfo>>;

export interface CoursesPage {
  items: Course[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface CourseFormInput {
  title: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  status: CourseStatus;
  category: string;
  start_date?: string;
  schedule_time?: string;
  location?: string;
  location_url?: string;
  price: number;
  price_group: number;
  instructor_id: string;
  skills?: { title: string; description: string; badge?: string }[];
  curriculum_headline?: string;
  qr_early_bird?: string;
  qr_individual?: string;
  qr_group_2?: string;
  qr_group_4?: string;
  qr_early_bird_promo?: string;
  qr_individual_promo?: string;
  qr_group_2_promo?: string;
  qr_group_4_promo?: string;
  early_bird_deadline?: string;
  plans_config?: PlansConfigMap;
}

export async function getCourses(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus | 'all';
  category?: string;
}): Promise<CoursesPage> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.status && params.status !== 'all') q.set('status', params.status);
  if (params.category) q.set('category', params.category);
  return adminFetch<CoursesPage>(`/courses?${q.toString()}`);
}

/** Lấy promo đang active theo từng gói của khóa học — dùng trong tab Cấu hình Đăng ký */
export async function getActivePromos(course_id: string): Promise<ActivePromoMap> {
  const res = await adminFetch<{ data: ActivePromoMap }>(`/promo-codes/active?course_id=${course_id}`);
  // adminFetch đã unwrap envelope, res là data trực tiếp
  return (res as unknown as ActivePromoMap) ?? {};
}

export async function createCourse(payload: CourseFormInput): Promise<Course> {
  return adminFetch<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCourse(id: string, payload: Partial<CourseFormInput>): Promise<Course> {
  return adminFetch<Course>(`/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCourse(id: string): Promise<void> {
  await adminFetch<Course>(`/courses/${id}`, { method: 'DELETE' });
}

// ── Instructors (for select options) ───────────────────
export interface InstructorOption {
  id: string;
  name: string;
}

export async function getInstructorOptions(): Promise<InstructorOption[]> {
  return adminFetch<InstructorOption[]>('/instructors');
}

export async function uploadAdminImage(file: File, bucket: 'courses' | 'blogs' = 'blogs'): Promise<string> {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  const res = await fetch(`${BASE}/courses/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let json: unknown;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    const err = json as ApiError;
    const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? 'Tải ảnh lên thất bại');
    throw new Error(msg);
  }

  const envelope = json as ApiEnvelope<string>;
  return envelope.data !== undefined ? envelope.data : (json as string);
}

export async function uploadCourseThumbnail(file: File): Promise<string> {
  return uploadAdminImage(file, 'courses');
}

export interface CourseModuleInput {
  title: string;
  subtitle?: string;
  description?: string;
  duration_minutes: number;
  start_time?: string;
  item_type: 'module' | 'break' | 'event';
}

export async function updateCourseModules(
  courseId: string,
  modules: CourseModuleInput[]
): Promise<void> {
  const cleaned = modules.map((m) => ({
    title: m.title ? m.title.trim() : '',
    subtitle: m.subtitle ? m.subtitle.trim() : undefined,
    description: m.description ? m.description.trim() : undefined,
    duration_minutes: Number(m.duration_minutes) || 0,
    start_time: m.start_time ? m.start_time.trim() : undefined,
    item_type: m.item_type || 'module',
  }));

  await adminFetch<void>(`/courses/${courseId}/modules`, {
    method: 'PUT',
    body: JSON.stringify({ modules: cleaned }),
  });
}

export async function getCourseModules(courseId: string): Promise<CourseModuleInput[]> {
  return adminFetch<CourseModuleInput[]>(`/courses/${courseId}/modules`);
}
