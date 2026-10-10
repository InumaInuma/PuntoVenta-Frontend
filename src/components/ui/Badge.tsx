import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'rose' | 'sky' | 'zinc';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'zinc',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    amber: 'bg-amber-100/80 text-amber-800 border-amber-300/60',
    emerald: 'bg-emerald-100/80 text-emerald-800 border-emerald-300/60',
    rose: 'bg-rose-100/80 text-rose-800 border-rose-300/60',
    sky: 'bg-sky-100/80 text-sky-800 border-sky-300/60',
    zinc: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold tracking-wide',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border uppercase ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
