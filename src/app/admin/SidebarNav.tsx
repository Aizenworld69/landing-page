"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAdmin } from '@/app/actions';

export default function SidebarNav() {
  const pathname = usePathname() ?? '/admin';

  const items = [
    { icon: 'grid_view', label: 'Overview', href: '/admin' },
    { icon: 'group', label: 'Registrations', href: '/admin' },
  ];

  return (
    <aside className="w-[200px] shrink-0 bg-white border-r border-slate-200 flex flex-col fixed top-0 bottom-0 left-0 z-20">
      <div className="px-5 py-5 border-b border-slate-100">
        <p className="font-black text-slate-900 text-base leading-tight">Quản lý Workshop</p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Aizen World</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-[#1a7a5e]/10 text-[#1a7a5e]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          Help Center
        </a>
        <form action={logoutAdmin}>
          <button
            type="submit"
            id="logout-btn"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
