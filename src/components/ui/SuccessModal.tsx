import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { CheckCircle2, Sparkles, Plus } from 'lucide-react';
import type { DetailItem } from './ConfirmModal';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string | React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  extraActionText?: string;
  onExtraAction?: () => void;
  extraActionIcon?: React.ReactNode;
  icon?: React.ReactNode;
  details?: DetailItem[];
  zIndex?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = '¡Operación Exitosa!',
  message,
  primaryActionText = 'Entendido',
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  extraActionText,
  onExtraAction,
  extraActionIcon,
  icon,
  details,
  zIndex = 'z-[60]',
}) => {
  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="max-w-sm" zIndex={zIndex}>
      <div className="flex flex-col items-center text-center p-1">
        {/* Ícono de Éxito con efecto pulso */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            {icon || <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />}
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center text-[9px] text-white">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-black text-slate-800 tracking-tight leading-snug">
          {title}
        </h3>

        {/* Mensaje descriptivo */}
        {message && (
          <div className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed max-w-xs">
            {message}
          </div>
        )}

        {/* Resumen de Detalles */}
        {details && details.length > 0 && (
          <div className="w-full mt-4 bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-3 text-left space-y-2">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-0.5 border-b border-emerald-100/50 last:border-b-0"
              >
                <span className="text-slate-500 font-medium">{item.label}</span>
                <span
                  className={`font-bold font-mono ${
                    item.highlight ? 'text-emerald-700 text-sm' : 'text-slate-800'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2 w-full mt-5">
          {extraActionText && onExtraAction && (
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={onExtraAction}
              icon={extraActionIcon}
              className="bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
            >
              {extraActionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={onSecondaryAction}
              icon={<Plus className="w-4 h-4 text-red-500" />}
              className="border-red-100 hover:border-red-200 text-red-600 hover:bg-red-50/50"
            >
              {secondaryActionText}
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={handlePrimary}
          >
            {primaryActionText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
