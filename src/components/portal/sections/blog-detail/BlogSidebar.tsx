import Link from 'next/link';

const CATEGORY_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/portal/courses', label: 'Khóa học' },
  { href: '/portal/instructors', label: 'Giảng viên' },
  { href: '/portal/resources', label: 'Tài nguyên' },
  { href: '/portal/blogs', label: 'Blogs' },
];

const SOCIAL_LINKS = [
  {
    href: 'https://www.facebook.com/aizenworlds',
    label: 'Facebook',
    icon: (
      <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5V9.4c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v2h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
    ),
  },
  {
    href: 'https://www.youtube.com/@AIZEN.OFFICIAL12',
    label: 'Youtube',
    icon: (
      <path d="M23 7.2s-.2-1.6-.9-2.3c-.9-.9-1.8-.9-2.3-1C16.5 3.6 12 3.6 12 3.6h0s-4.5 0-7.8.3c-.5 0-1.4.1-2.3 1C1.2 5.6 1 7.2 1 7.2S.8 9.1.8 11v1.9c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.9.2 7.6.3 7.6.3s4.5 0 7.8-.3c.5 0 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8zM9.7 14.9V8.7l6 3.1-6 3.1z" />
    ),
  },
  {
    href: 'https://www.tiktok.com/@aizen.official12',
    label: 'Tiktok',
    icon: (
      <path d="M16.6 5.8c-.8-.9-1.3-2-1.4-3.3h-2.9v13.4c0 1.6-1.3 2.9-2.9 2.9-1.6 0-2.9-1.3-2.9-2.9 0-1.6 1.3-2.9 2.9-2.9.3 0 .6 0 .9.1V9.9c-.3 0-.6-.1-.9-.1-3.2 0-5.8 2.6-5.8 5.8s2.6 5.8 5.8 5.8 5.8-2.6 5.8-5.8V9.1c1.2.9 2.7 1.4 4.3 1.4V7.6c-1 0-1.9-.4-2.9-1.8z" />
    ),
  },
];

export function BlogSidebar() {
  return (
    <aside className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Danh mục bài viết</h3>
        <ul className="space-y-2">
          {CATEGORY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-gray-500 hover:text-sky-500 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Kết nối với AIZEN</h3>
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="group w-10 h-10 flex items-center justify-center rounded-full bg-white text-sky-500 shadow-sm ring-1 ring-sky-200 hover:bg-sky-500 hover:text-white hover:ring-sky-500 hover:shadow-md hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                {social.icon}
              </svg>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
