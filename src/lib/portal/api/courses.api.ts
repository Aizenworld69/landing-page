import { apiClient } from './api-client';
import type { Course, CourseWithDetails, PaginatedResponse } from '@aizen/types';

export interface CourseQuery {
  status?: 'upcoming' | 'completed';
  category?: string;
  year?: string;
  page?: number;
  limit?: number;
}

export async function getCourses(
  query: CourseQuery = {},
): Promise<PaginatedResponse<Course>> {
  const { data } = await apiClient.get<{ data: PaginatedResponse<Course> }>('/portal/courses', {
    params: query,
  });
  return data.data;
}

export async function getCourseBySlug(slug: string): Promise<CourseWithDetails> {
  const { data } = await apiClient.get<{ data: CourseWithDetails }>(`/courses/${slug}`);
  return data.data;
}
