import { Button } from '@/components/portal/ui/Button';
import type { Review } from '@aizen/types';

interface ReviewsSectionProps {
  reviews?: Review[];
}

const DEMO_REVIEWS = [
  {
    id: '1',
    author: 'Nguyễn Văn Minh',
    role: 'Product Manager tại Vingroup',
    rating: 5,
    content:
      'Khóa học thay đổi hoàn toàn cách tôi làm việc. Sau 2 tuần, tôi đã tự động hóa được 60% công việc hàng ngày bằng AI.',
  },
  {
    id: '2',
    author: 'Trần Thị Hương',
    role: 'Marketing Director',
    rating: 5,
    content:
      'Giảng viên rất thực chiến, không lý thuyết suông. Mỗi buổi đều có bài tập thực tế áp dụng ngay được vào công việc.',
  },
  {
    id: '3',
    author: 'Lê Quốc Bảo',
    role: 'CEO Startup EdTech',
    rating: 5,
    content:
      'Đầu tư tốt nhất của tôi trong năm nay. ROI từ việc áp dụng AI vào vận hành đã bù đắp chi phí học phí gấp 10 lần.',
  },
];

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const displayReviews = DEMO_REVIEWS;

  return (
    <section className="bg-transparent py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2">
            Phản hồi
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-white drop-shadow-md">
            Học viên nói gì về AIZEN?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {displayReviews.map((review) => (
            <div key={review.id} className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 shadow-2xl hover:border-amber-400/80 transition-all">
              <div className="flex mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-slate-200 text-sm leading-relaxed mb-5 font-medium">&quot;{review.content}&quot;</p>
              <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-extrabold text-sm flex-shrink-0">
                  {review.author[0]}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{review.author}</p>
                  <p className="text-xs text-amber-400 font-semibold">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" className="border-white/40 text-white bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 hover:border-amber-400 hover:text-amber-300 font-bold px-6 py-2.5 rounded-full cursor-pointer">
            Xem thêm đánh giá
          </Button>
        </div>
      </div>
    </section>
  );
}
