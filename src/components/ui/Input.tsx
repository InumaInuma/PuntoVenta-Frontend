import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full h-12 bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/15 rounded-2xl text-base text-slate-800 placeholder-slate-400 transition-all outline-none ${
              icon ? 'pl-11' : 'pl-4'
            } ${rightElement ? 'pr-12' : 'pr-4'} ${
              error ? 'border-red-400 bg-red-50/30' : ''
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center justify-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs font-medium text-red-500 px-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
