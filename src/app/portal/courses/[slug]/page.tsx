import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { CourseHero } from '@/components/portal/sections/course-detail/CourseHero';
import { CourseSkills } from '@/components/portal/sections/course-detail/CourseSkills';
import { CourseCurriculum } from '@/components/portal/sections/course-detail/CourseCurriculum';
import { InstructorCard } from '@/components/portal/sections/course-detail/InstructorCard';
import { CoursePlanSection } from '@/components/portal/sections/course-detail/CoursePlanSection';
import type { CourseWithDetails } from '@aizen/types';

async function getCourse(slug: string): Promise<CourseWithDetails | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('fetch failed');
    const json = (await res.json()) as { data: CourseWithDetails };
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: 'Không tìm thấy khóa học' };
  return {
    title: course.title,
    description: course.description,
    openGraph: { images: course.thumbnail_url ? [course.thumbnail_url] : [] },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ backgroundImage: "url('/backgoundTrangkhoahoc.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
      >
        {/* Hero - narrow centered */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
          <CourseHero course={course} />
        </div>

        {/* Skills - wider, centered */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <CourseSkills skills={course.skills} />
        </div>

        {/* Curriculum - narrow centered */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <CourseCurriculum modules={course.course_modules} headline={course.curriculum_headline} />
        </div>

        {/* Instructor - narrow centered */}
        {course.instructors && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <InstructorCard
              instructor={{
                ...course.instructors,
                bio: course.instructors.bio ?? '',
              }}
            />
          </div>
        )}

        {/* Plan section - wider, centered */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <CoursePlanSection
            courseId={course.id}
            courseTitle={course.title}
            price={course.price}
            priceGroup={course.price_group}
            qrEarlyBird={course.qr_early_bird ?? undefined}
            qrIndividual={course.qr_individual ?? undefined}
            qrGroup2={course.qr_group_2 ?? undefined}
            qrGroup4={course.qr_group_4 ?? undefined}
            qrEarlyBirdPromo={course.qr_early_bird_promo ?? undefined}
            qrIndividualPromo={course.qr_individual_promo ?? undefined}
            qrGroup2Promo={course.qr_group_2_promo ?? undefined}
            qrGroup4Promo={course.qr_group_4_promo ?? undefined}
            plansConfig={course.plans_config ?? undefined}
            earlyBirdDeadline={course.early_bird_deadline ?? undefined}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
