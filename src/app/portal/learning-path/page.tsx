import type { Metadata } from 'next';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';
import { CareerRoadmapSection } from '@/components/portal/sections/home/CareerRoadmapSection';

export const metadata: Metadata = {
  title: 'Lộ trình học tập chuyên gia AI | AIZEN Education',
  description: 'Khám phá con đường từ người mới bắt đầu đến chuyên gia làm chủ công nghệ AI, thiết kế riêng cho kỷ nguyên kinh tế số.',
};

export default function LearningPathPage() {
  return (
    <>
      <Navbar />
      <main>
        <CareerRoadmapSection />
      </main>
      <Footer />
    </>
  );
}
