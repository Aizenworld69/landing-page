import Link from 'next/link';
import { Button } from '@/components/portal/ui/Button';

export function HeroSection() {
  return (
    <section className="hero-animated-bg relative overflow-hidden py-24 md:py-36 bg-gradient-to-b from-[#EBF5FF] via-[#E0EFFF] to-[#EFF6FF]">
      {/* ═══ Animated Background Layers ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

        {/* Layer 1: Aurora gradient sweep — hiệu ứng cực quang */}
        <div className="hero-aurora absolute inset-0" />

        {/* Layer 2: Large floating blobs — rõ ràng, sống động */}
        <div className="hero-blob hero-blob-1 absolute w-[500px] h-[500px] rounded-full" />
        <div className="hero-blob hero-blob-2 absolute w-[400px] h-[400px] rounded-full" />
        <div className="hero-blob hero-blob-3 absolute w-[350px] h-[350px] rounded-full" />

        {/* Layer 3: Grid pattern — lưới công nghệ */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(14,165,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Layer 4: Animated wave — sóng gradient di chuyển */}
        <div className="hero-wave absolute bottom-0 left-0 w-[200%] h-[200px]" />

        {/* Layer 5: Floating particles — hạt sáng lớn hơn, rõ hơn */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="hero-particle-v2 absolute rounded-full"
            style={{
              width: `${4 + (i % 5) * 3}px`,
              height: `${4 + (i % 5) * 3}px`,
              left: `${5 + (i * 5.5) % 90}%`,
              top: `${8 + (i * 13.7) % 80}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 4) * 1.5}s`,
              background: i % 3 === 0
                ? 'rgba(14,165,233,0.7)'
                : i % 3 === 1
                  ? 'rgba(99,102,241,0.6)'
                  : 'rgba(56,189,248,0.65)',
            }}
          />
        ))}

        {/* Layer 6: Spinning geometric shapes */}
        <div className="absolute top-[10%] right-[15%] w-24 h-24 border-2 border-sky-400/25 rounded-full animate-spin-slow" />
        <div className="absolute top-[10%] right-[15%] w-24 h-24 border-2 border-indigo-400/20 rounded-full animate-spin-slow [animation-direction:reverse] [animation-duration:8s]" style={{ transform: 'rotate(45deg)' }} />
        <div className="absolute bottom-[18%] left-[10%] w-16 h-16 border-2 border-dashed border-sky-400/20 rounded-full animate-spin-slow [animation-duration:15s]" />
        <div className="absolute top-[40%] left-[5%] w-10 h-10 border-2 border-sky-300/20 rounded-lg animate-spin-slow [animation-duration:10s]" />
        <div className="absolute top-[25%] right-[8%] w-6 h-6 bg-sky-400/15 rounded-md hero-float-shape" />
        <div className="absolute bottom-[30%] right-[20%] w-4 h-4 bg-indigo-400/20 rounded-full hero-float-shape [animation-delay:1.5s]" />

        {/* Layer 7: Animated connection lines — SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
          <line x1="8%" y1="25%" x2="30%" y2="75%" stroke="#0EA5E9" strokeWidth="1" className="hero-line hero-line-1" />
          <line x1="65%" y1="10%" x2="92%" y2="60%" stroke="#6366F1" strokeWidth="1" className="hero-line hero-line-2" />
          <line x1="20%" y1="85%" x2="80%" y2="20%" stroke="#0EA5E9" strokeWidth="0.8" className="hero-line hero-line-3" />
          <line x1="50%" y1="5%" x2="55%" y2="95%" stroke="#38BDF8" strokeWidth="0.5" className="hero-line hero-line-1" />
          {/* Node dots */}
          <circle cx="8%" cy="25%" r="3" fill="#0EA5E9" opacity="0.3" className="hero-node" />
          <circle cx="30%" cy="75%" r="3" fill="#0EA5E9" opacity="0.3" className="hero-node" style={{ animationDelay: '0.5s' }} />
          <circle cx="65%" cy="10%" r="3" fill="#6366F1" opacity="0.3" className="hero-node" style={{ animationDelay: '1s' }} />
          <circle cx="92%" cy="60%" r="3" fill="#6366F1" opacity="0.3" className="hero-node" style={{ animationDelay: '1.5s' }} />
        </svg>
      </div>

      {/* ═══ Content ═══ */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-md border border-sky-200/70 rounded-full shadow-sm shadow-sky-100/50">
          <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
          <span className="text-sky-600 text-xs font-semibold tracking-wide">Nền tảng đào tạo AI hàng đầu Việt Nam</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
          {['Làm', 'Chủ', 'Tương', 'Lai', 'cùng'].map((word, i) => (
            <span
              key={word}
              className="hero-word-reveal inline-block"
              style={{ animationDelay: `${200 + i * 120}ms` }}
            >
              {word}&nbsp;
            </span>
          ))}
          <br />
          <span className="hero-title-shimmer inline-block">AIZEN Education</span>
        </h1>

        <p className="animate-slide-up delay-200 text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tăng tốc sự nghiệp với các khóa học chuyên nghiệp cao cấp, ứng dụng AI. Thiết kế dành cho các nhà lãnh đạo doanh nghiệp và những người đổi mới công nghệ.
        </p>

        <div className="animate-slide-up delay-300 flex justify-center gap-4 flex-wrap">
          <Link href="/portal/courses">
            <Button
              size="lg"
              className="px-8 py-4 rounded-lg font-semibold bg-sky-500 hover:bg-sky-600 transition-all text-white border-0 text-base shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              Khám phá chương trình học →
            </Button>
          </Link>
          <Link href="/portal/instructors">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 rounded-lg font-semibold text-base border-sky-200 text-sky-600 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:-translate-y-0.5 transition-all"
            >
              Gặp gỡ giảng viên
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="animate-fade-in delay-500 mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[
            { value: '500+', label: 'Học viên' },
            { value: '10+', label: 'Khóa học' },
            { value: '98%', label: 'Hài lòng' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-sky-500">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}