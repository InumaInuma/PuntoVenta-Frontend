import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Download, Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  canPromptDirectly: boolean;
  onInstallClick: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  canPromptDirectly,
  onInstallClick,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instalar App Almain POS"
      position="center"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 p-1 text-slate-800">
        {/* Encabezado con el Logo Almain */}
        <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
          <img
            src="/icons/icon-192x192.png"
            alt="Almain POS Logo"
            className="w-14 h-14 rounded-2xl shadow-md border border-slate-200/60 object-cover shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-900 text-sm tracking-tight leading-tight">
                Almain POS
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Punto de Venta Móvil & Retail Cloud
            </p>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Compatible con Android, iPhone y PC</span>
            </p>
          </div>
        </div>

        {/* Contenido según Plataforma: iOS Safari vs Android/Chrome */}
        {isIOS ? (
          <div className="space-y-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Instrucciones para iPhone / iPad (Safari)</span>
            </div>
            <ol className="space-y-2.5 text-[11px] pl-1 font-medium text-amber-900/90">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 font-black flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  En la barra inferior de Safari, toca el botón <strong>Compartir</strong>{' '}
                  <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-sky-600" />
                  (cuadrado con flecha hacia arriba).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 font-black flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Desliza hacia abajo en el menú y selecciona{' '}
                  <strong className="text-slate-900">"Agregar a pantalla de inicio"</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 font-black flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Presiona <strong className="text-slate-900">"Agregar"</strong> en la esquina superior derecha. ¡Listo! Se abrirá como app nativa a pantalla completa.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Instala la aplicación para una experiencia más rápida, acceso instantáneo desde tu pantalla de inicio y visualización a pantalla completa sin barras del navegador.
            </p>

            {canPromptDirectly && (
              <button
                type="button"
                onClick={() => {
                  onInstallClick();
                  onClose();
                }}
                className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all cursor-pointer"
              >
                <Download className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>INSTALAR APLICACIÓN AHORA</span>
              </button>
            )}

            {!canPromptDirectly && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">¿Cómo instalar en este navegador?</p>
                <p>
                  Abre el menú de opciones del navegador (los 3 puntos ⋮ en la esquina superior) y presiona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botón de cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-9 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isIOS ? 'Entendido' : 'Tal vez más tarde'}
        </button>
      </div>
    </Modal>
  );
};
