import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, Send, Check, Copy, ExternalLink } from 'lucide-react';
import type { CreatedTenantCredentials } from '../types';
import toast from 'react-hot-toast';

interface TenantCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CreatedTenantCredentials | null;
}

const PRODUCTION_APP_URL = 'https://mi-comercio-almain.vercel.app';

export const TenantCreatedModal: React.FC<TenantCreatedModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  // URL directa de login con usuario y contraseña pre-cargados
  const getLoginUrl = () => {
    if (!data) return `${PRODUCTION_APP_URL}/login`;
    return `${PRODUCTION_APP_URL}/login?u=${encodeURIComponent(data.username)}&p=${encodeURIComponent(data.passwordProvisorio)}`;
  };

  const getCredencialesTexto = () => {
    if (!data) return '';
    const loginUrl = getLoginUrl();

    return `¡Hola ${data.nombreDueno}! 🎉\n\nTu negocio *${data.nombreComercial}* ya está registrado y activo en *Almain POS*.\n\n🌐 *Enlace de Ingreso:* ${loginUrl}\n👤 *Usuario:* ${data.username}\n🔑 *Contraseña Provisional:* ${data.passwordProvisorio}\n\n🔒 *Importante:* Al abrir el enlace tus credenciales se cargarán automáticamente. Por tu seguridad, en este primer ingreso el sistema te solicitará configurar tu contraseña definitiva.\n\n¡Muchos éxitos en tus ventas! 🚀`;
  };

  const handleCopiarCredenciales = async () => {
    try {
      await navigator.clipboard.writeText(getCredencialesTexto());
      setHasCopied(true);
      toast.success('Credenciales copiadas al portapapeles');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleCompartirWhatsApp = () => {
    if (!data) return;
    const cleanPhone = data.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
    const texto = encodeURIComponent(getCredencialesTexto());
    window.open(`https://wa.me/${phoneWithCountry}?text=${texto}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¡Comercio y Cuenta Creados!"
      position="center"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-slate-800 p-1">
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            {data?.nombreComercial}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registrado exitosamente en la plataforma Almain POS.
          </p>
        </div>

        {/* Tarjeta de Credenciales */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-2.5 font-mono text-xs shadow-lg border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800 text-[11px] font-sans">
            <span>Datos de Acceso del Dueño</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
              Primer Login Obligatorio
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Dueño:</span>
              <span className="text-white font-bold">{data?.nombreDueno}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Usuario:</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/40">
                {data?.username}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Contraseña:</span>
              <span className="text-amber-300 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/40">
                {data?.passwordProvisorio}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 font-sans">Enlace POS:</span>
              <a
                href={getLoginUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-300 hover:text-indigo-200 underline truncate max-w-[220px] inline-flex items-center gap-1 font-sans text-[11px]"
              >
                <span>mi-comercio-almain.vercel.app/login</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Botones de Compartir y Acciones */}
        <div className="space-y-2.5 pt-2">
          {/* Botón WhatsApp - Verde Esmeralda Profesional (no fosforescente) */}
          <button
            type="button"
            onClick={handleCompartirWhatsApp}
            className="w-full h-11.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs flex flex-row items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.2] shrink-0" />
            <span>Enviar por WhatsApp al Cliente</span>
          </button>

          {/* Botón Copiar Credenciales - Icono y texto alineados en una sola fila */}
          <button
            type="button"
            onClick={handleCopiarCredenciales}
            className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.99] border border-slate-200/80 text-slate-800 font-bold text-xs flex flex-row items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            {hasCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                <span className="text-emerald-700 font-extrabold">¡Credenciales Copiadas al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Copiar Credenciales</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-8 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
