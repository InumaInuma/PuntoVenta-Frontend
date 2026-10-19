import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AuthService } from '@/services/auth/authService';
import {
  Building2,
  User,
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Lock,
  AtSign,
  FileText,
} from 'lucide-react';
import type { CreatedTenantCredentials } from '../types';
import toast from 'react-hot-toast';
import { FormValidators, validateAndNotify } from '@/utils/formValidation';

interface NewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credentials: CreatedTenantCredentials) => void;
  onReload: () => Promise<void>;
}

export const NewTenantModal: React.FC<NewTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onReload,
}) => {
  // Formulario nuevo comercio (SaaS Onboarding)
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [tipoDocNuevo, setTipoDocNuevo] = useState<'RUC' | 'DNI' | 'CE' | 'OTRO'>('RUC');
  const [rucNuevo, setRucNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [correoNuevo, setCorreoNuevo] = useState('');
  const [direccionNueva, setDireccionNueva] = useState('');
  const [planIdNuevo, setPlanIdNuevo] = useState<number>(2); // 2: Minimarket Pro
  const [nombreDuenoNuevo, setNombreDuenoNuevo] = useState('');
  const [usernameNuevo, setUsernameNuevo] = useState('');
  const [isUsernameCustomized, setIsUsernameCustomized] = useState(false);
  const [passwordProvisorio, setPasswordProvisorio] = useState('Almain123*');
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);

  const sanitizeUsername = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes y diacríticos
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // Solo caracteres alfanuméricos
  };

  const generarPasswordAleatoria = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setPasswordProvisorio(`Almain${randomSuffix}*`);
  };

  const resetForm = () => {
    setNombreNuevo('');
    setRucNuevo('');
    setTelefonoNuevo('');
    setCorreoNuevo('');
    setDireccionNueva('');
    setNombreDuenoNuevo('');
    setUsernameNuevo('');
    setIsUsernameCustomized(false);
    setPasswordProvisorio('Almain123*');
  };

  const handleCrearTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUsername = (usernameNuevo.trim() || sanitizeUsername(nombreNuevo)).toLowerCase();
    const finalPassword = passwordProvisorio.trim() || 'Almain123*';

    // Validación estricta con Toasts reutilizables
    const isValid = validateAndNotify([
      () => FormValidators.required(nombreNuevo, 'Nombre Comercial', 3),
      () => FormValidators.documento(tipoDocNuevo, rucNuevo),
      () => FormValidators.telefonoPeru(telefonoNuevo, true),
      () => FormValidators.email(correoNuevo, true),
      () => FormValidators.required(nombreDuenoNuevo, 'Nombre Completo del Dueño', 3),
      () => FormValidators.username(finalUsername, 3),
      () => FormValidators.password(finalPassword, 6),
    ]);

    if (!isValid) return;

    const precioPlan = planIdNuevo === 3 ? 149 : planIdNuevo === 2 ? 89 : 49;

    setIsSubmittingTenant(true);
    try {
      await AuthService.registerTenant({
        idPais: 1,
        idTipoDocumento: tipoDocNuevo === 'RUC' ? 1 : tipoDocNuevo === 'DNI' ? 2 : tipoDocNuevo === 'CE' ? 3 : 5,
        nombreComercial: nombreNuevo.trim(),
        razonSocial: `${nombreNuevo.trim()} ${tipoDocNuevo === 'RUC' ? 'S.A.C.' : ''}`,
        tipoDocumento: tipoDocNuevo,
        numeroDocumento: rucNuevo.trim(),
        telefonoWhatsApp: telefonoNuevo.trim(),
        correoContacto: correoNuevo.trim() || undefined,
        direccion: direccionNueva.trim() || undefined,
        idPlanSaaS: planIdNuevo,
        diasDuracionPlan: 30,
        montoPagado: precioPlan,
        metodoPago: 'Yape',
        nombreCompletoUsuario: nombreDuenoNuevo.trim(),
        username: finalUsername,
        passwordProvisorio: finalPassword,
      });

      await onReload();
      onClose();

      onSuccess({
        nombreComercial: nombreNuevo.trim(),
        nombreDueno: nombreDuenoNuevo.trim(),
        username: finalUsername,
        passwordProvisorio: finalPassword,
        telefono: telefonoNuevo.trim(),
      });

      toast.success(`¡Negocio "${nombreNuevo.trim()}" registrado en la base de datos!`);
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (err instanceof Error ? err.message : 'Error al registrar comercio');
      toast.error(msg);
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Negocio / Tenant"
      position="bottom"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleCrearTenant} className="space-y-3.5 text-slate-800 p-0.5 sm:p-1">
        {/* Sección 1: Datos del Comercio */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 sm:space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Datos del Comercio
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">Información comercial del establecimiento</p>
            </div>
          </div>

          {/* Nombre Comercial */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre Comercial <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ej: Panadería Jonas"
                value={nombreNuevo}
                onChange={(e) => {
                  const val = e.target.value;
                  setNombreNuevo(val);
                  if (!isUsernameCustomized) {
                    setUsernameNuevo(sanitizeUsername(val));
                  }
                }}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                required
              />
            </div>
          </div>

          {/* Tipo Doc + Número */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo Doc</label>
              <select
                value={tipoDocNuevo}
                onChange={(e) => {
                  setTipoDocNuevo(e.target.value as 'RUC' | 'DNI' | 'CE' | 'OTRO');
                  setRucNuevo('');
                }}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-2.5 text-xs outline-none font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="RUC">RUC (Perú)</option>
                <option value="DNI">DNI (Perú)</option>
                <option value="CE">CE (Extranjería)</option>
                <option value="OTRO">Otro / Internacional</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                N° Documento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    tipoDocNuevo === 'RUC'
                      ? '11 dígitos (ej: 20601234567)'
                      : tipoDocNuevo === 'DNI'
                      ? '8 dígitos (ej: 71234567)'
                      : tipoDocNuevo === 'CE'
                      ? '8 a 12 caracteres'
                      : 'NIT, RUT o Cédula (máx 20)'
                  }
                  maxLength={
                    tipoDocNuevo === 'RUC'
                      ? 11
                      : tipoDocNuevo === 'DNI'
                      ? 8
                      : tipoDocNuevo === 'CE'
                      ? 12
                      : 20
                  }
                  value={rucNuevo}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (tipoDocNuevo === 'RUC' || tipoDocNuevo === 'DNI') {
                      val = val.replace(/\D/g, '');
                    }
                    setRucNuevo(val);
                  }}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Celular + Plan SaaS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Celular <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="987654321"
                  value={telefonoNuevo}
                  onChange={(e) => setTelefonoNuevo(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plan SaaS</label>
              <select
                value={planIdNuevo}
                onChange={(e) => setPlanIdNuevo(Number(e.target.value))}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-2.5 text-xs outline-none font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value={1}>Plan Básico (S/ 49 / mes)</option>
                <option value={2}>Minimarket Pro (S/ 89 / mes)</option>
                <option value={3}>Plan Cadena (S/ 149 / mes)</option>
              </select>
            </div>
          </div>

          {/* Correo + Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="contacto@negocio.pe"
                  value={correoNuevo}
                  onChange={(e) => setCorreoNuevo(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Dirección (Opcional)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Av. Principal 123"
                  value={direccionNueva}
                  onChange={(e) => setDireccionNueva(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Cuenta del Dueño / Administrador */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 sm:space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
            <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Cuenta de Acceso para el Dueño
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">Credenciales para iniciar sesión en Almain POS</p>
            </div>
          </div>

          {/* Nombre Dueño */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre Completo del Dueño <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ej: Jonas Peres Chavez"
                value={nombreDuenoNuevo}
                onChange={(e) => setNombreDuenoNuevo(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                required
              />
            </div>
          </div>

          {/* Usuario + Contraseña Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Columna Usuario */}
            <div>
              <div className="h-6 flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Usuario <span className="text-rose-500">*</span>
                </label>
                {nombreNuevo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUsernameCustomized(false);
                      setUsernameNuevo(sanitizeUsername(nombreNuevo));
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title="Usar nombre del negocio como usuario"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Del negocio</span>
                  </button>
                ) : <span className="h-4" />}
              </div>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ej: panaderiajonas"
                  value={usernameNuevo}
                  onChange={(e) => {
                    setIsUsernameCustomized(true);
                    setUsernameNuevo(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                  }}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-mono font-bold text-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>

            {/* Columna Contraseña */}
            <div>
              <div className="h-6 flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Clave Provisional <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setPasswordProvisorio('Almain123*')}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Usar clave genérica Almain123*"
                  >
                    Genérica
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={generarPasswordAleatoria}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-800 inline-flex items-center gap-0.5 cursor-pointer"
                    title="Generar clave aleatoria"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Aleatoria</span>
                  </button>
                </div>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={passwordProvisorio}
                  onChange={(e) => setPasswordProvisorio(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-mono font-bold text-amber-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Aviso informativo elegante */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs">
            <span className="text-sm shrink-0">💡</span>
            <p className="leading-relaxed">
              El dueño ingresará con el usuario <strong>{usernameNuevo || '...'}</strong> y su clave provisional. Por seguridad, en su primer acceso el sistema le solicitará configurar su contraseña personal definitiva.
            </p>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmittingTenant}
            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmittingTenant ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>REGISTRAR NEGOCIO Y CREAR CUENTA</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
