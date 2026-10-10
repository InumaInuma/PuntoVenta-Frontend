import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'h-10 px-3.5 text-xs rounded-xl gap-1.5',
    md: 'h-12 px-5 text-sm rounded-2xl gap-2',
    lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg shadow-red-500/25',
    secondary: 'bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-md shadow-slate-800/20',
    outline: 'bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 active:bg-slate-50',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-600/20',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 active:bg-slate-200',
  }[variant];

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
