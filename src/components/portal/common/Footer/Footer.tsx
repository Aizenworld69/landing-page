import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.png"
                alt="AIZEN Education"
                width={110}
                height={38}
                className="object-contain h-9 w-auto"
              />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Đồng hành cùng doanh nghiệp trong kỷ nguyên trí tuệ nhân tạo. Giải pháp tối ưu, hiệu suất đột phá và thực chiến.
            </p>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-gray-900 font-bold text-sm mb-4">Thông tin liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>112 Lý Phục Man, Phường Tân Thuận, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>0362 077 399</span>
              </li>
            </ul>
          </div>

          {/* Policy & Links */}
          <div>
            <h3 className="text-gray-900 font-bold text-sm mb-4">Chính sách & Liên kết</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Chính sách bảo mật' },
                { href: '/terms', label: 'Điều khoản dịch vụ' },
                { href: '/contact', label: 'Liên hệ' },
                { href: '/', label: 'Về AIZEN' },
                { href: '/support', label: 'Trung tâm trợ giúp' },
                { href: '/careers', label: 'Tuyển dụng' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-sky-500 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 mt-10 pt-6">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} AIZEN Academy. Tôn vinh Sự Xuất sắc Chuyên nghiệp.
          </p>
        </div>
      </div>

      {/* Zalo float button — link theo SĐT Zalo chính thức của AIZEN */}
      <a
        href="https://zalo.me/84362077399"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0068ff] text-white rounded-full shadow-xl px-4 py-3 hover:scale-105 transition-transform"
        aria-label="Hỗ trợ Zalo"
      >
        <svg viewBox="0 0 48 48" className="w-5 h-5" fill="white">
          <path d="M24 4C13 4 4 12 4 22c0 5.5 2.8 10.5 7.3 14L10 40l7-2.5A20.7 20.7 0 0024 40c11 0 20-8 20-18S35 4 24 4z" />
        </svg>
        <span className="text-sm font-semibold">Hỗ trợ Zalo</span>
      </a>
    </footer>
  );
}
