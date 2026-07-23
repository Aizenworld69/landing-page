import { getAdminToken } from '../admin/auth';
import { apiClient } from './api-client';
import type { Blog } from '@aizen/types';

export interface AdminBlogQuery {
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBlogs {
  items: Blog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface BlogImageDto {
  url: string;
  caption?: string;
}

export interface CreateBlogPayload {
  title: string;
  slug: string;
  excerpt?: string;
  body_html?: string;
  thumbnail_url?: string;
  category?: 'blog' | 'news';
  author?: string;
  source_name?: string;
  source_url?: string;
  images?: BlogImageDto[];
  status?: 'draft' | 'published' | 'archived';
}

export type UpdateBlogPayload = Partial<CreateBlogPayload>;

function adminAuthHeader(): { Authorization: string } {
  const token = getAdminToken();
  return { Authorization: `Bearer ${token ?? ''}` };
}

export async function adminGetBlogs(query: AdminBlogQuery = {}): Promise<PaginatedBlogs> {
  const { data } = await apiClient.get<{ data: PaginatedBlogs }>('/portal/blogs/admin/list', {
    params: query,
    headers: adminAuthHeader(),
  });
  return data.data;
}

export async function adminGetBlogById(id: string): Promise<Blog> {
  const { data } = await apiClient.get<{ data: Blog }>(`/blogs/admin/${id}`, {
    headers: adminAuthHeader(),
  });
  return data.data;
}

export async function adminCreateBlog(payload: CreateBlogPayload): Promise<Blog> {
  const { data } = await apiClient.post<{ data: Blog }>('/portal/blogs/admin', payload, {
    headers: adminAuthHeader(),
  });
  return data.data;
}

export async function adminUpdateBlog(id: string, payload: UpdateBlogPayload): Promise<Blog> {
  const { data } = await apiClient.patch<{ data: Blog }>(`/blogs/admin/${id}`, payload, {
    headers: adminAuthHeader(),
  });
  return data.data;
}

export async function adminDeleteBlog(id: string): Promise<void> {
  await apiClient.delete(`/blogs/admin/${id}`, {
    headers: adminAuthHeader(),
  });
}