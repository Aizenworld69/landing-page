import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài nguyên học tập',
  description:
    'Kho tài nguyên AI miễn phí: ebook, cheat sheet, video, template và công cụ học tập từ AIZEN Education.',
};

const RESOURCES = [
  {
    id: 'ebook-ai-basics',
    category: 'Ebook',
    categoryColor: 'bg-sky-500/20 text-sky-300 border border-sky-400/30',
    title: 'AI Cơ bản cho người mới bắt đầu',
    description:
      'Tổng quan toàn diện về Trí tuệ nhân tạo, Machine Learning và Deep Learning dành cho người mới.',
    tags: ['AI', 'Beginner', 'PDF'],
    link: '#',
    free: true,
  },
  {
    id: 'cheatsheet-python',
    category: 'Cheat Sheet',
    categoryColor: 'bg-violet-500/20 text-violet-300 border border-violet-400/30',
    title: 'Python cho Data Science – Cheat Sheet',
    description:
      'Tổng hợp các hàm, thư viện Pandas, NumPy, Matplotlib thường dùng nhất trong Data Science.',
    tags: ['Python', 'Data Science', 'PDF'],
    link: '#',
    free: true,
  },
  {
    id: 'video-prompt-engineering',
    category: 'Video',
    categoryColor: 'bg-rose-500/20 text-rose-300 border border-rose-400/30',
    title: 'Prompt Engineering thực chiến',
    description:
      'Series video hướng dẫn viết prompt hiệu quả cho ChatGPT, Claude và các mô hình ngôn ngữ lớn.',
    tags: ['LLM', 'Prompt', 'Video'],
    link: '#',
    free: true,
  },
  {
    id: 'template-ml-project',
    category: 'Template',
    categoryColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
    title: 'ML Project Template – GitHub',
    description:
      'Cấu trúc dự án Machine Learning chuẩn, bao gồm data pipeline, training script và deployment.',
    tags: ['Template', 'GitHub', 'ML'],
    link: '#',
    free: true,
  },
  {
    id: 'ebook-deep-learning',
    category: 'Ebook',
    categoryColor: 'bg-sky-500/20 text-sky-300 border border-sky-400/30',
    title: 'Deep Learning từ nền tảng đến ứng dụng',
    description:
      'Từ perceptron đến Transformer – lộ trình học Deep Learning đầy đủ nhất bằng tiếng Việt.',
    tags: ['Deep Learning', 'Neural Network', 'PDF'],
    link: '#',
    free: false,
  },
  {
    id: 'cheatsheet-sql',
    category: 'Cheat Sheet',
    categoryColor: 'bg-violet-500/20 text-violet-300 border border-violet-400/30',
    title: 'SQL cho Data Analyst – Cheat Sheet',
    description:
      'Tổng hợp các câu lệnh SQL từ cơ bản đến nâng cao: JOIN, Window Functions, CTEs.',
    tags: ['SQL', 'Analytics', 'PDF'],
    link: '#',
    free: true,
  },
];

const CATEGORIES = ['Tất cả', 'Ebook', 'Cheat Sheet', 'Video', 'Template'];

export default function ResourcesPage() {
  return (
    <div className="py-8">
      {/* Hero */}
      <section className="py-12 bg-transparent text-center sm:text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-3">
            Miễn phí &amp; Chất lượng
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-md">
            Kho tài nguyên học tập
          </h1>
          <p className="text-slate-100 text-base max-w-2xl font-medium">
            Ebook, cheat sheet, video và template được tuyển chọn kỹ lưỡng bởi đội ngũ AIZEN —
            hoàn toàn miễn phí cho cộng đồng.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { value: '50+', label: 'Tài liệu' },
              { value: '12K+', label: 'Lượt tải' },
              { value: '100%', label: 'Miễn phí' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-slate-900/60 p-3 px-5 rounded-2xl border border-slate-700/60 backdrop-blur-md">
                <p className="text-2xl font-black text-amber-400">{value}</p>
                <p className="text-slate-200 text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                i === 0
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 text-slate-200 border border-slate-700/60 hover:border-amber-400 hover:text-white backdrop-blur-md'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resource cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESOURCES.map((res) => (
            <a
              key={res.id}
              id={`resource-${res.id}`}
              href={res.link}
              className="group bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-5 hover:border-amber-400 transition-all flex flex-col gap-3 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${res.categoryColor}`}
                >
                  {res.category}
                </span>
                {res.free ? (
                  <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Miễn phí
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Premium
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-white leading-snug group-hover:text-amber-300 transition-colors">
                {res.title}
              </h2>

              {/* Description */}
              <p className="text-slate-300 text-xs leading-relaxed flex-1">{res.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {res.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-amber-400 text-xs font-bold group-hover:text-amber-300 flex items-center gap-1">
                  Tải xuống
                  <svg
                    className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-14 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <p className="text-2xl font-black mb-2">Nhận tài nguyên mới nhất qua email</p>
          <p className="text-amber-100 mb-6 text-sm font-medium">
            Đăng ký để nhận thông báo khi chúng tôi phát hành ebook, cheat sheet và video mới.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              id="newsletter-email"
              type="email"
              placeholder="email@example.com"
              className="flex-1 px-4 py-2.5 rounded-xl text-slate-900 font-semibold text-sm outline-none bg-white focus:ring-2 focus:ring-amber-300"
            />
            <button
              id="newsletter-submit"
              className="px-5 py-2.5 bg-slate-900 text-white font-extrabold rounded-xl text-sm hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-md"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
