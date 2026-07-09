import { apiClient } from './api-client';
import type { Enrollment } from '@aizen/types';

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const { data } = await apiClient.get<{ data: Enrollment[] }>('/portal/my-courses');
  return data.data;
}

export async function downloadCertificate(enrollmentId: string): Promise<Blob> {
  const res = await apiClient.get<Blob>(`/my-courses/${enrollmentId}/certificate`, {
    responseType: 'blob',
  });
  return res.data;
}
