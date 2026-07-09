import type { Metadata } from 'next';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { InstructorGrid } from '@/components/portal/sections/instructors/InstructorGrid';
import { ToolsSection } from '@/components/portal/sections/instructors/ToolsSection';
import { ReviewsSection } from '@/components/portal/sections/instructors/ReviewsSection';
import type { Instructor } from '@aizen/types';

export const metadata: Metadata = {
  title: 'Giảng viên',
  description: 'Đội ngũ chuyên gia AI thực chiến của AIZEN Education',
};

async function getInstructors(): Promise<Instructor[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/instructors`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Instructor[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function InstructorsPage() {
  const instructors = await getInstructors();

  return (
    <>
      <Navbar />
      <main>
        {/* Hero — nền xanh nhạt đồng bộ với trang chủ */}
        <section className="bg-[#EFF6FF] py-16 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-3">
              Đội ngũ chuyên gia
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Học từ những người làm thực tế
            </h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
              Tất cả giảng viên của AIZEN đều là những chuyên gia đang trực tiếp ứng dụng AI
              trong doanh nghiệp và nghiên cứu.
            </p>
          </div>
        </section>

        <InstructorGrid instructors={instructors} />
        <ToolsSection />
        <ReviewsSection />
      </main>
      <Footer />
    </>
  );
}
