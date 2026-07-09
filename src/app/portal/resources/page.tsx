import type { Metadata } from 'next';
import { Navbar } from '@/components/portal/common/Navbar';
import { Footer } from '@/components/portal/common/Footer';

export const metadata: Metadata = {
  title: 'Tài nguyên học tập',
  description:
    'Kho tài nguyên AI miễn phí: ebook, cheat sheet, video, template và công cụ học tập từ AIZEN Education.',
};

const RESOURCES = [
  {
    id: 'ebook-ai-basics',
    category: 'Ebook',
    categoryColor: 'bg-sky-100 text-sky-700',
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
    categoryColor: 'bg-violet-100 text-violet-700',
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
    categoryColor: 'bg-rose-100 text-rose-700',
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
    categoryColor: 'bg-emerald-100 text-emerald-700',
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
    categoryColor: 'bg-sky-100 text-sky-700',
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
    categoryColor: 'bg-violet-100 text-violet-700',
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
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC]">
        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-3">
              Miễn phí &amp; Chất lượng
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Kho tài nguyên học tập
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl">
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
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-sky-500">{value}</p>
                  <p className="text-gray-500 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  i === 0
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-400 hover:text-sky-500'
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
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-sky-200 transition-all flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${res.categoryColor}`}
                  >
                    {res.category}
                  </span>
                  {res.free ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Miễn phí
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-sky-600 transition-colors">
                  {res.title}
                </h2>

                {/* Description */}
                <p className="text-gray-500 text-xs leading-relaxed flex-1">{res.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {res.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md border border-gray-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-2 border-t border-gray-50">
                  <span className="text-sky-500 text-xs font-semibold group-hover:text-sky-600 flex items-center gap-1">
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
          <div className="mt-14 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-8 text-white text-center">
            <p className="text-2xl font-bold mb-2">Nhận tài nguyên mới nhất qua email</p>
            <p className="text-sky-100 mb-6 text-sm">
              Đăng ký để nhận thông báo khi chúng tôi phát hành ebook, cheat sheet và video mới.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                id="newsletter-email"
                type="email"
                placeholder="email@example.com"
                className="flex-1 px-4 py-2.5 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-white"
              />
              <button
                id="newsletter-submit"
                className="px-5 py-2.5 bg-white text-sky-600 font-bold rounded-xl text-sm hover:bg-sky-50 transition-colors whitespace-nowrap"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
