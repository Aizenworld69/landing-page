'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getCourses, type CourseQuery } from '@/lib/portal/api/courses.api';
import type { Course, PaginatedResponse } from '@aizen/types';

const EMPTY: PaginatedResponse<Course> = {
  items: [],
  pagination: { total: 0, page: 1, limit: 9, totalPages: 0 },
};

export function useCourses(initialQuery: CourseQuery = {}) {
  const [query, setQuery] = useState<CourseQuery>(initialQuery);

  const { data, error, isLoading, mutate } = useSWR(
    ['/portal/courses', query],
    () => getCourses(query),
    {
      fallbackData: EMPTY,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data ?? EMPTY,
    isLoading,
    error: error instanceof Error ? error.message : (error ? String(error) : null),
    setQuery,
    refetch: () => mutate(),
  };
}
