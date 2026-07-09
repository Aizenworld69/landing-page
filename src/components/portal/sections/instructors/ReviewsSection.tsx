import { Button } from '@/components/portal/ui/Button';
import type { Review } from '@aizen/types';

interface ReviewsSectionProps {
  reviews?: Review[];
}

// Static fallback reviews khi chưa có data
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
  const displayReviews = DEMO_REVIEWS; // swap to `reviews` khi có real data

  return (
    <section className="bg-[#F8FAFC] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary-500 text-sm font-semibold uppercase tracking-widest mb-2">
            Phản hồi
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Học viên nói gì về AIZEN?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {displayReviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">&quot;{review.content}&quot;</p>
              <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                  {review.author[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{review.author}</p>
                  <p className="text-xs text-gray-400">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline">Xem thêm đánh giá</Button>
        </div>
      </div>
    </section>
  );
}
