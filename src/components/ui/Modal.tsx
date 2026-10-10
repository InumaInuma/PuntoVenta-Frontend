import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'center';
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full ${maxWidth} bg-white shadow-2xl transition-all flex flex-col max-h-[92dvh] ${
          position === 'bottom'
            ? 'rounded-t-[32px] sm:rounded-3xl'
            : 'rounded-3xl m-4'
        }`}
      >
        {/* Drag handle pill for mobile bottom sheet */}
        {position === 'bottom' && (
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
