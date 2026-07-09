'use client';

import useSWR from 'swr';
import { getInstructors } from '@/lib/portal/api/instructors.api';
import type { Instructor } from '@aizen/types';

export function useInstructors() {
  const { data, error, isLoading } = useSWR<Instructor[]>(
    '/portal/instructors',
    () => getInstructors(),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    instructors: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : (error ? String(error) : null),
  };
}
