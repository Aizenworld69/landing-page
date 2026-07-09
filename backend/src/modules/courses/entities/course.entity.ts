export type CourseStatus = 'upcoming' | 'completed';
export type ModuleItemType = 'module' | 'break' | 'event';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  status: CourseStatus;
  category: string;
  start_date: string | null;
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
  early_bird_deadline?: string | null;
  plans_config?: any;
  created_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  subtitle: string | null;       // Mô tả phụ hiển thị dưới title
  description: string | null;    // Chi tiết nội dung (optional)
  duration_minutes: number;
  order_index: number;
  start_time: string | null;     // 'HH:MM' — nếu null thì auto-calculate
  item_type: ModuleItemType;     // 'module' | 'break' | 'event'
}

export interface CourseWithDetails extends Course {
  course_modules: CourseModule[];
  instructors: {
    id: string;
    name: string;
    title: string;
    avatar_url: string | null;
    bio: string;
  } | null;
}
