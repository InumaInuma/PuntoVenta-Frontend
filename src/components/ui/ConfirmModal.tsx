import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { HelpCircle, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  isLoading?: boolean;
  icon?: React.ReactNode;
  details?: DetailItem[];
  zIndex?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  isLoading = false,
  icon,
  details,
  zIndex = 'z-[60]',
}) => {
  const variantConfig = {
    primary: {
      bg: 'bg-red-50 text-red-600 border-red-100',
      btnVariant: 'primary' as const,
      defaultIcon: <HelpCircle className="w-8 h-8" />,
    },
    danger: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      btnVariant: 'danger' as const,
      defaultIcon: <AlertTriangle className="w-8 h-8" />,
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      btnVariant: 'secondary' as const,
      defaultIcon: <AlertCircle className="w-8 h-8" />,
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      btnVariant: 'primary' as const,
      defaultIcon: <CheckCircle2 className="w-8 h-8" />,
    },
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="max-w-sm" zIndex={zIndex}>
      <div className="flex flex-col items-center text-center p-1">
        {/* Ícono de Estado */}
        <div
          className={`w-16 h-16 rounded-3xl border flex items-center justify-center mb-3 shadow-inner ${variantConfig.bg}`}
        >
          {icon || variantConfig.defaultIcon}
        </div>

        {/* Título */}
        <h3 className="text-lg font-black text-slate-800 tracking-tight leading-snug">
          {title}
        </h3>

        {/* Descripción */}
        {description && (
          <div className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed max-w-xs">
            {description}
          </div>
        )}

        {/* Resumen de Detalles Opcional */}
        {details && details.length > 0 && (
          <div className="w-full mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left space-y-2">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100/70 last:border-b-0"
              >
                <span className="text-slate-500 font-medium">{item.label}</span>
                <span
                  className={`font-bold font-mono ${
                    item.highlight ? 'text-red-600 text-sm' : 'text-slate-800'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2.5 w-full mt-5">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variantConfig.btnVariant}
            size="md"
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
