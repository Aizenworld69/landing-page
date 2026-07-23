import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-slate-500">/</span>}
              {isLast || !item.href ? (
                <span className={isLast ? 'text-amber-300 font-extrabold' : ''}>{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-amber-400 transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
