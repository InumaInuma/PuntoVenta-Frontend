import React from 'react';
import { Delete, Check } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface NumericKeypadProps {
  value: string;
  onChange: (newValue: string) => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  totalPagar?: number;
  allowDecimals?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onConfirm,
  confirmLabel = 'COBRAR',
  totalPagar,
  allowDecimals = true,
}) => {
  const { triggerTap } = useHaptics();

  const handleDigit = (digit: string) => {
    triggerTap();
    if (digit === '.') {
      if (!allowDecimals) return;
      if (!value) {
        onChange('0.');
        return;
      }
      if (value.includes('.')) return;
      onChange(value + '.');
      return;
    }

    if (value === '0') {
      onChange(digit);
    } else {
      // Evitar más de 2 decimales si ya hay punto
      if (value.includes('.')) {
        const [, dec] = value.split('.');
        if (dec && dec.length >= 2) return;
      }
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    triggerTap();
    if (!value || value.length <= 1) {
      onChange('');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    triggerTap();
    onChange('');
  };

  const handleQuickCash = (amount: number) => {
    triggerTap();
    onChange(amount.toFixed(2));
  };

  return (
    <div className="w-full flex flex-col gap-2.5 select-none">
      {/* Botones de billetes rápidos comunes en Perú */}
      {totalPagar !== undefined && (
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickCash(totalPagar)}
            className="h-10 text-[11px] font-black rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            Exacto
          </button>
          {[10, 20, 50, 100].map((billete) => (
            <button
              key={billete}
              type="button"
              onClick={() => handleQuickCash(billete)}
              className="h-10 text-xs font-black rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              S/ {billete}
            </button>
          ))}
        </div>
      )}

      {/* Teclado numérico táctil */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-14 bg-white border border-slate-200/80 rounded-2xl text-xl font-bold text-slate-800 shadow-sm active:bg-slate-200 active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Fila inferior: Punto / 0 / Borrar */}
        <button
          type="button"
          onClick={() => (allowDecimals ? handleDigit('.') : handleClear())}
          className="h-14 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xl font-black text-slate-700 active:bg-slate-200 active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer"
        >
          {allowDecimals ? '.' : 'C'}
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 bg-white border border-slate-200/80 rounded-2xl text-xl font-bold text-slate-800 shadow-sm active:bg-slate-200 active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 active:bg-rose-100 active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>

      {/* Botón de Confirmación / Cobro */}
      {onConfirm && (
        <button
          type="button"
          onClick={() => {
            triggerTap();
            onConfirm();
          }}
          className="w-full h-14 mt-1 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-black text-base tracking-wide rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>{confirmLabel}</span>
        </button>
      )}
    </div>
  );
};
