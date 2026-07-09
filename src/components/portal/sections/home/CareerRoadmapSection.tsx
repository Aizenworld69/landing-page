import Link from 'next/link';
import { Button } from '@/components/portal/ui/Button';

// ─── Icons ────────────────────────────────────────────
function IconBulb({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3V16h6v-.9c0-.5.2-1 .6-1.3A6 6 0 0012 3z" />
    </svg>
  );
}
function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function IconCap({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7m-7-9.5V17a7 5 0 0014 0v-5.5" />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Static data ──────────────────────────────────────
interface RoadmapStep {
  key: string;
  title: string;
  sublabel: string;
  description: string;
  bullets: string[];
  icon: (props: { className?: string }) => React.ReactNode;
  accent: string; // tailwind color token, e.g. 'sky', 'cyan', 'amber'
  highlighted?: boolean;
}

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    key: 'foundation',
    title: 'Foundation',
    sublabel: 'NỀN TẢNG',
    description: 'Xây dựng tư duy AI và hiểu biết căn bản về cách tương tác với máy tính thông qua ngôn ngữ tự nhiên.',
    bullets: ['AI Mindset', 'Basic Prompt Engineering', 'Generative AI Tools'],
    icon: IconBulb,
    accent: 'sky',
  },
  {
    key: 'professional',
    title: 'Professional',
    sublabel: 'CHUYÊN NGHIỆP',
    description: 'Trở thành người sử dụng thành thạo các mô hình AI mạnh nhất để giải quyết các vấn đề phức tạp.',
    bullets: ['Làm chủ Claude & GPT-4', 'Midjourney Visuals', 'Advanced Prompting Techniques'],
    icon: IconTarget,
    accent: 'cyan',
  },
  {
    key: 'advanced',
    title: 'Advanced',
    sublabel: 'NÂNG CAO',
    description: 'Tích hợp AI vào quy trình làm việc kinh doanh và tự động hóa các tác vụ lặp đi lặp lại.',
    bullets: ['AI for Business Strategy', 'Automation Workflows', 'Zapier & Make Integration'],
    icon: IconBolt,
    accent: 'amber',
  },
  {
    key: 'mastery',
    title: 'Mastery',
    sublabel: 'CHUYÊN GIA',
    description: 'Xây dựng các giải pháp AI tùy chỉnh, độc quyền và dẫn dắt sự thay đổi công nghệ trong doanh nghiệp.',
    bullets: ['Custom AI Systems', 'Enterprise Deployment', 'AI Leadership'],
    icon: IconCap,
    accent: 'sky',
    highlighted: true,
  },
];

const ACCENT_CLASSES: Record<string, { ring: string; text: string; bg: string }> = {
  sky: { ring: 'border-sky-400/60', text: 'text-sky-400', bg: 'bg-sky-500/15' },
  cyan: { ring: 'border-cyan-400/60', text: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  amber: { ring: 'border-amber-400/60', text: 'text-amber-400', bg: 'bg-amber-500/15' },
};

export function CareerRoadmapSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0B1628 0%, #0F1E35 55%, #0B1628 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-400 text-[11px] font-bold uppercase tracking-widest mb-5">
            Career Roadmap
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Lộ trình học tập <span className="text-sky-400">chuyên gia AI</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Khám phá con đường từ người mới bắt đầu đến chuyên gia làm chủ công nghệ AI, thiết kế riêng cho kỷ nguyên kinh tế số.
          </p>
        </div>

        {/* Icon timeline row */}
        <div className="relative flex items-center justify-between mb-6 px-2 sm:px-6">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/10" aria-hidden="true" />
          {ROADMAP_STEPS.map((step) => {
            const accent = ACCENT_CLASSES[step.accent]!;
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative z-10 flex justify-center" style={{ width: '25%' }}>
                {step.highlighted ? (
                  <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full border-2 ${accent.ring} ${accent.bg} flex items-center justify-center`}
                    style={{ backgroundColor: '#0F1E35' }}>
                    <Icon className={`w-5 h-5 ${accent.text}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {ROADMAP_STEPS.map((step) => {
            const accent = ACCENT_CLASSES[step.accent]!;
            return (
              <div key={step.key}
                className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col">
                <h3 className="text-white font-bold text-base mb-0.5">{step.title}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${accent.text}`}>
                  {step.sublabel}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                      <IconCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accent.text}`} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* CTA box */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-white font-extrabold text-xl mb-1.5">
              Sẵn sàng bắt đầu hành trình của bạn?
            </h3>
            <p className="text-slate-400 text-sm max-w-md">
              Đăng ký ngay hôm nay để nhận được lộ trình cá nhân hóa và các bài giảng miễn phí từ chuyên gia hàng đầu.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap justify-center">
            <Link href="/portal/courses">
              <Button className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm border-0 transition-colors">
                Bắt đầu miễn phí
              </Button>
            </Link>
            <Link href="/portal/courses">
              <Button variant="outline"
                className="px-6 py-3 rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold text-sm transition-colors">
                Xem chi tiết khóa học
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
