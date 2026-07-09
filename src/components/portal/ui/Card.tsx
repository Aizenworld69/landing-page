import { cn } from '@/lib/portal/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
