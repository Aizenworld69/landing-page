import { apiClient } from './api-client';
import type { Instructor } from '@aizen/types';

export async function getInstructors(): Promise<Instructor[]> {
  const { data } = await apiClient.get<{ data: Instructor[] }>('/portal/instructors');
  return data.data;
}

export async function getInstructorById(id: string): Promise<Instructor> {
  const { data } = await apiClient.get<{ data: Instructor }>(`/instructors/${id}`);
  return data.data;
}
