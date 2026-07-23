import type { Metadata } from 'next';
import { InstructorGrid } from '@/components/portal/sections/instructors/InstructorGrid';
import { ToolsSection } from '@/components/portal/sections/instructors/ToolsSection';
import { ReviewsSection } from '@/components/portal/sections/instructors/ReviewsSection';
import type { Instructor } from '@aizen/types';
import { fetchInstructorsServer } from '@/lib/portal/server-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Giảng viên',
  description: 'Đội ngũ chuyên gia AI thực chiến của AIZEN Education',
};

async function getInstructors(): Promise<Instructor[]> {
  return fetchInstructorsServer();
}

export default async function InstructorsPage() {
  const instructors = await getInstructors();

  return (
    <div className="py-8">
      {/* Hero */}
      <section className="py-16 text-center bg-transparent">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-3">
            Đội ngũ chuyên gia
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
            Học từ những người làm thực tế
          </h1>
          <p className="text-slate-100 text-base max-w-xl mx-auto leading-relaxed font-medium">
            Tất cả giảng viên của AIZEN đều là những chuyên gia đang trực tiếp ứng dụng AI
            trong doanh nghiệp và nghiên cứu.
          </p>
        </div>
      </section>

      <InstructorGrid instructors={instructors} />
      <ToolsSection />
      <ReviewsSection />
    </div>
  );
}
