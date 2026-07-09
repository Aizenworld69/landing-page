import { cn } from '@/lib/portal/utils/cn';

interface BadgeProps {
  variant: 'upcoming' | 'completed' | 'special' | 'urgent';
  children: React.ReactNode;
  className?: string;
  /** Hien dau cham nhap nhay de gay chu y (dung cho khoa hoc sap dien ra) */
  pulse?: boolean;
}

const variantStyles = {
  upcoming: 'bg-primary-500 text-white shadow-sm shadow-primary-500/30',
  urgent: 'bg-orange-500 text-white shadow-sm shadow-orange-500/40',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  special: 'bg-primary-500 text-white',
};

const dotStyles = {
  upcoming: 'bg-white',
  urgent: 'bg-white',
  completed: 'bg-green-500',
  special: 'bg-white',
};

export function Badge({ variant, children, className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase',
        variantStyles[variant],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn('animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-75', dotStyles[variant])} />
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotStyles[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}
