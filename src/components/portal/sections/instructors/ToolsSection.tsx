import Image from 'next/image';
import { FadeIn, StaggerChildren } from '@/components/portal/ui/AnimationWrapper';

const tools = [
  {
    name: 'Claude AI',
    src: '/logo_claudeAi.jpg',
    description: 'Hỗ trợ viết lách, phân tích dữ liệu, tóm tắt và lập trình vượt trội.',
    badge: 'Trợ lý đa năng',
  },
  {
    name: 'Gemini AI',
    src: '/gemina.jpg',
    description: 'Mô hình AI đa phương thức thế hệ mới với hiệu năng vượt trội từ Google.',
    badge: 'Google AI',
  },
  {
    name: 'NotebookLM',
    src: '/notbookLm.jpg',
    description: 'Trợ lý đắc lực trong việc tóm tắt, học tập và nghiên cứu tài liệu.',
    badge: 'Nghiên cứu tài liệu',
  },
  {
    name: 'Dreamina AI',
    src: '/dreamia_ai.jpg',
    description: 'Công cụ sáng tạo hình ảnh và video nghệ thuật đỉnh cao từ TikTok.',
    badge: 'Tạo ảnh & Video',
  },
  {
    name: 'Hailuo AI',
    src: '/hailuo_ai.jpg',
    description: 'Sáng tạo các thước phim chuyển động mượt mà và vô cùng chân thực.',
    badge: 'Tạo Video AI',
  },
];

export function ToolsSection() {
  return (
    <section className="bg-white py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up" className="text-center mb-12">
          <p className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-2">
            Công cụ
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Bộ công cụ làm chủ AI
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Thanh thạo các công cụ AI hàng đầu như Claude, Gemini, NotebookLM, Dreamina và Hailuo để bứt
            phá hiệu suất công việc của bạn.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" stagger={100}>
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-slate-50/50 border border-gray-100/80 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:shadow-sky-100/50 hover:border-sky-200/50 hover:bg-white group"
            >
              <div className="relative size-20 md:size-24 mb-4 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={tool.src}
                  alt={tool.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 80px, 96px"
                  priority
                />
              </div>
              
              <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1 group-hover:text-sky-500 transition-colors">
                {tool.name}
              </h3>
              
              <span className="inline-block px-2.5 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-semibold rounded-full border border-sky-100 mb-3">
                {tool.badge}
              </span>
              
              <p className="text-xs text-gray-500 leading-relaxed min-h-[48px]">
                {tool.description}
              </p>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

