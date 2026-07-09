import { apiClient } from './api-client';
import type { Blog, BlogWithRelated, PaginatedResponse } from '@aizen/types';

export interface BlogQuery {
  category?: string;
  page?: number;
  limit?: number;
}

export async function getBlogs(query: BlogQuery = {}): Promise<PaginatedResponse<Blog>> {
  const { data } = await apiClient.get<{ data: PaginatedResponse<Blog> }>('/portal/blogs', {
    params: query,
  });
  return data.data;
}

export async function getBlogBySlug(slug: string): Promise<BlogWithRelated> {
  const { data } = await apiClient.get<{ data: BlogWithRelated }>(`/blogs/${slug}`);
  return data.data;
}
