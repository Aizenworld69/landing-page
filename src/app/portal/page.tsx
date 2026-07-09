import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { HeroSection } from '@/components/portal/sections/home/HeroSection';
import { UpcomingCoursesSection } from '@/components/portal/sections/home/UpcomingCoursesSection';
import { CompletedCoursesPreviewSection } from '@/components/portal/sections/home/CompletedCoursesPreviewSection';
import type { Course, PaginatedResponse } from '@aizen/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api';

// Cache 60s — không cần real-time, dữ liệu khoá học thay đổi ít
async function getUpcomingCourses(): Promise<Course[]> {
  try {
    const res = await fetch(
      `${API_URL}/courses?status=upcoming&limit=3`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: PaginatedResponse<Course> };
    return json.data?.items ?? [];
  } catch (e) {
    console.error('[getUpcomingCourses]', e);
    return [];
  }
}

async function getCompletedCourses(): Promise<Course[]> {
  try {
    const res = await fetch(
      `${API_URL}/courses?status=completed&limit=3`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: PaginatedResponse<Course> };
    return json.data?.items ?? [];
  } catch (e) {
    console.error('[getCompletedCourses]', e);
    return [];
  }
}

export default async function HomePage() {
  const [upcomingCourses, completedCourses] = await Promise.all([
    getUpcomingCourses(),
    getCompletedCourses(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <UpcomingCoursesSection courses={upcomingCourses} />
        <CompletedCoursesPreviewSection courses={completedCourses} />
      </main>
      <Footer />
    </>
  );
}