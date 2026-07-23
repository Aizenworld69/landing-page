import Link from 'next/link';
import { Button } from '@/components/portal/ui/Button';
import { AnimatedCounter } from '@/components/portal/ui/AnimatedCounter';

export function HeroSection() {
  return (
    <section className="hero-animated-bg relative overflow-hidden py-24 md:py-36 bg-transparent">

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
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900/80 backdrop-blur-md border border-amber-400/50 rounded-full shadow-lg shadow-orange-500/10 hover:scale-105 transition-transform duration-300">
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-amber-300 text-xs font-extrabold tracking-wide">Nền tảng đào tạo AI hàng đầu Việt Nam 🚀</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 tracking-tight drop-shadow-md">
          {['Làm', 'Chủ', 'Tương', 'Lai', 'cùng'].map((word, i) => (
            <span
              key={word}
              className="hero-word-reveal inline-block text-white"
              style={{ animationDelay: `${200 + i * 120}ms` }}
            >
              {word}&nbsp;
            </span>
          ))}
          <br />
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 font-black drop-shadow-lg animate-pulse-glow">
            AIZEN Education
          </span>
        </h1>

        <p className="animate-slide-up delay-200 text-base md:text-lg text-slate-100 font-medium max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-sm">
          Tăng tốc sự nghiệp với các khóa học chuyên nghiệp cao cấp, ứng dụng AI. Thiết kế dành cho các nhà lãnh đạo doanh nghiệp và những người đổi mới công nghệ.
        </p>

        <div className="animate-slide-up delay-300 flex justify-center gap-4 flex-wrap">
          <Link href="/portal/courses">
            <Button
              size="lg"
              className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all text-white border-0 text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 active:translate-y-0 cursor-pointer"
            >
              Khám phá chương trình học →
            </Button>
          </Link>
          <Link href="/portal/instructors">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 rounded-xl font-bold text-base border-white/60 text-white bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/80 hover:border-amber-400 hover:text-amber-300 hover:-translate-y-1 transition-all cursor-pointer shadow-md"
            >
              Gặp gỡ giảng viên
            </Button>
          </Link>
        </div>

        {/* Stats row with Animated Counter */}
        <div className="animate-fade-in delay-500 mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[
            { end: 500, suffix: '+', label: 'Học viên' },
            { end: 10, suffix: '+', label: 'Khóa học' },
            { end: 98, suffix: '%', label: 'Hài lòng' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-xl hover:border-sky-400/60 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-sky-950/20 group"
            >
              <div className="text-2xl md:text-3xl font-black text-amber-400 group-hover:text-sky-300 transition-colors">
                <AnimatedCounter end={s.end} suffix={s.suffix} />
              </div>
              <div className="text-xs text-slate-200 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}