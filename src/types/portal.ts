export type CourseStatus = 'upcoming' | 'completed';
export type PlanType = 'individual' | 'group_2' | 'group_4';
export type EnrollmentStatus = 'upcoming' | 'completed';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  status: CourseStatus;
  category: string;
  start_date: string | null;
  early_bird_deadline?: string | null;
  price: number;
  price_group: number;
  instructor_id: string;
  skills?: { title: string; description: string; badge?: string }[];
  curriculum_headline?: string | null;
  qr_early_bird?: string | null;
  qr_individual?: string | null;
  qr_group_2?: string | null;
  qr_group_4?: string | null;
  qr_early_bird_promo?: string | null;
  qr_individual_promo?: string | null;
  qr_group_2_promo?: string | null;
  qr_group_4_promo?: string | null;
  plans_config?: any;
  created_at: string;
}

export type ModuleItemType = 'module' | 'break' | 'event';

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  subtitle: string | null;       // Dòng phụ hiển thị dưới title trong timeline
  description: string | null;    // Mô tả chi tiết (optional)
  duration_minutes: number;
  order_index: number;
  start_time: string | null;     // 'HH:MM' — nếu null thì auto-calculate
  item_type: ModuleItemType;     // 'module' | 'break' | 'event'
}

export interface CourseWithDetails extends Course {
  course_modules: CourseModule[];
  instructors: Pick<Instructor, 'id' | 'name' | 'title' | 'avatar_url' | 'bio'> | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  social_links: Record<string, string>;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  completed_at: string | null;
  created_at: string;
  courses: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail_url' | 'status' | 'start_date' | 'category'> | null;
}

export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  content: string;
  created_at: string;
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface Registration {
  id: string;
  course_id: string;
  full_name: string;
  phone: string;
  email: string;
  company: string | null;
  plan: PlanType;
  created_at: string;
}

// ============================================================
// Blogs
// ============================================================
export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogImage {
  url: string;
  caption?: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  thumbnail_url: string | null;
  category: string;
  author: string;
  source_name: string | null;
  source_url: string | null;
  images: BlogImage[];
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
}

export interface BlogWithRelated extends Blog {
  related: Blog[];
}
