import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { InstallPwaModal } from './InstallPwaModal';

interface InstallPwaButtonProps {
  variant?: 'pill' | 'sidebar' | 'header' | 'login';
  className?: string;
}

export const InstallPwaButton: React.FC<InstallPwaButtonProps> = ({
  variant = 'pill',
  className = '',
}) => {
  const { isInstallable, canPromptDirectly, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Si ya está instalada o no está disponible en este entorno, no mostrar
  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setIsModalOpen(true);
      return;
    }

    if (canPromptDirectly) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const renderButton = () => {
    switch (variant) {
      case 'header':
        return (
          <button
            type="button"
            onClick={handleClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
            title="Descargar Almain POS como App"
          >
            <Download className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="sm:hidden">App</span>
          </button>
        );

      case 'sidebar':
        return (
          <button
            type="button"
            onClick={handleClick}
            className={`w-full h-11 px-3 rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/10 hover:from-red-600/30 hover:to-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-between text-xs font-bold transition-all cursor-pointer active:scale-[0.99] ${className}`}
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-red-400 stroke-[2.5]" />
              <span>Instalar Almain en tu Móvil / PC</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/30 text-red-300 uppercase">
              Gratis
            </span>
          </button>
        );

      case 'login':
        return (
          <button
            type="button"
            onClick={handleClick}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200/90 shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
          >
            <Smartphone className="w-4 h-4 text-red-500" />
            <span>Descargar como App</span>
          </button>
        );

      case 'pill':
      default:
        return (
          <button
            type="button"
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-red-600/20 transition-all cursor-pointer ${className}`}
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Descargar App</span>
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      <InstallPwaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        canPromptDirectly={canPromptDirectly}
        onInstallClick={promptInstall}
      />
    </>
  );
};
