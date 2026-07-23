/**
 * Server-side data fetcher — dùng Supabase Admin Client trực tiếp
 * KHÔNG dùng fetch HTTP ra ngoài, tránh lỗi ECONNREFUSED khi build
 */
import { supabaseAdmin } from '@/lib/portal/supabase-server';
import { adjustCourseStatus, sortCoursesSmart } from '@/lib/portal/utils/course';
import type { Course, Blog, Instructor, PaginatedResponse } from '@aizen/types';

// ─── Courses ─────────────────────────────────────────────────────────────────

interface FetchCoursesParams {
  status?: string;
  category?: string;
  year?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// NOTE: In-memory cache — chỉ hoạt động hiệu quả trong Node.js long-running process.
// Trong môi trường serverless/Edge, mỗi cold start tạo Map mới → cache reset.
// Nếu cần cache thực sự cho serverless, dùng Next.js `unstable_cache` hoặc Redis.
const courseCacheStore = new Map<string, { data: PaginatedResponse<Course>; timestamp: number }>();
const CACHE_TTL_MS = 15_000;
// Max 100 entries — tránh memory leak nếu các combination params tăng không giới hạn
const CACHE_MAX_SIZE = 100;

export function invalidateCoursesServerCache() {
  courseCacheStore.clear();
}

export async function fetchCoursesServer(params: FetchCoursesParams = {}): Promise<PaginatedResponse<Course>> {
  const { status = '', category = '', year = '', page = 1, limit = 9, search = '' } = params;
  const cacheKey = `${status}:${category}:${year}:${page}:${limit}:${search}`;
  const now = Date.now();

  const cached = courseCacheStore.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const offset = (page - 1) * limit;

  let builder = supabaseAdmin
    .from('courses')
    .select('*');

  if (search) builder = builder.ilike('title', `%${search}%`);

  const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (status === 'upcoming') {
    builder = builder.eq('status', 'upcoming').or(`start_date.gte.${today},start_date.is.null`);
  } else if (status === 'completed') {
    builder = builder.or(`status.eq.completed,start_date.lt.${today}`);
  } else if (status) {
    builder = builder.eq('status', status);
  }

  if (category) builder = builder.eq('category', category);
  if (year) builder = builder.like('start_date', `${year}%`);

  try {
    const { data, error } = await builder;
    if (error) throw error;
    
    // 1. Cập nhật trạng thái từng khóa học
    const adjusted = (data || []).map((c) => adjustCourseStatus(c as Course));

    // 2. Sắp xếp thông minh: Khóa SẮP DIỄN RA (gần nhất) lên ĐẦU, Khóa ĐÃ HOÀN THÀNH xuống CUỐI
    const sorted = sortCoursesSmart(adjusted);

    // 3. Phân trang
    const paginatedItems = sorted.slice(offset, offset + limit);

    const result: PaginatedResponse<Course> = {
      items: paginatedItems,
      pagination: {
        total: sorted.length,
        page,
        limit,
        totalPages: Math.ceil(sorted.length / limit),
      },
    };

    courseCacheStore.set(cacheKey, { data: result, timestamp: now });
    // Evict toàn bộ cache nếu vượt quá CACHE_MAX_SIZE
    if (courseCacheStore.size > CACHE_MAX_SIZE) courseCacheStore.clear();
    return result;
  } catch (err) {
    console.error('Lỗi trong fetchCoursesServer:', err);
    return { items: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }
}

export async function fetchCourseBySlugServer(slug: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        course_modules (id, title, subtitle, description, duration_minutes, order_index, start_time, item_type),
        instructors (id, name, title, avatar_url, bio)
      `)
      .eq('slug', slug)
      .order('order_index', { referencedTable: 'course_modules', ascending: true })
      .single();

    if (error) return null;
    return adjustCourseStatus(data as Course);
  } catch {
    return null;
  }
}

// ─── Blogs ───────────────────────────────────────────────────────────────────

interface FetchBlogsParams {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchBlogsServer(params: FetchBlogsParams = {}): Promise<PaginatedResponse<Blog>> {
  const { category, page = 1, limit = 6, search } = params;
  const offset = (page - 1) * limit;

  let builder = supabaseAdmin
    .from('blogs')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  if (category) builder = builder.ilike('category', category);
  if (search) builder = builder.ilike('title', `%${search}%`);

  const query = builder
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  try {
    const { data, error, count } = await query;
    if (error) throw error;
    return {
      items: (data || []) as unknown as Blog[],
      pagination: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    };
  } catch (err) {
    console.error('fetchBlogsServer error:', JSON.stringify(err, null, 2), err);
    return { items: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }
}

export async function fetchBlogBySlugServer(slug: string) {
  try {
    const { data: blog, error } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !blog) return null;

    const { data: related } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .eq('category', blog.category)
      .neq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(3);

    return { ...blog, related: related ?? [] };
  } catch {
    return null;
  }
}

// ─── Instructors ─────────────────────────────────────────────────────────────

export async function fetchInstructorsServer(): Promise<Instructor[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('instructors')
      .select('id, name, title, bio, avatar_url, social_links')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Instructor[];
  } catch {
    return [];
  }
}
