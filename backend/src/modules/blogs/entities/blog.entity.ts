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
