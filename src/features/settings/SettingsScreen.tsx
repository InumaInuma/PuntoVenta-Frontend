import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Printer, Store, QrCode, Smartphone, Image as ImageIcon, Upload, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { posStorage } from '@/services/storage/pos.storage';
import { configuracionService } from '@/services/backend/configuracionService';
import { printThermalReceipt } from '@/services/printer/thermalReceiptService';

export const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombreNegocio, setNombreNegocio] = useState(() => {
    return localStorage.getItem('almain_pos_business_name') || user?.nombreEmpresa || 'Bodega Don Pepe';
  });
  const [numeroRuc, setNumeroRuc] = useState(() => {
    return localStorage.getItem('almain_pos_ruc') || '20601234567';
  });
  const [direccion, setDireccion] = useState(() => {
    return localStorage.getItem('almain_pos_address') || 'Av. Los Próceres 123';
  });
  const [telefonoYape, setTelefonoYape] = useState(() => {
    return localStorage.getItem('almain_pos_yape_phone') || '987654321';
  });
  const [titularYape, setTitularYape] = useState(() => {
    return localStorage.getItem('almain_pos_yape_owner') || user?.nombre || 'José Pepe Quispe';
  });
  const [mensajePieTicket, setMensajePieTicket] = useState(() => {
    return localStorage.getItem('almain_pos_ticket_footer') || '¡Gracias por su preferencia! Revise su vuelto.';
  });
  const [anchoPapel, setAnchoPapel] = useState<'58mm' | '80mm'>(() => {
    return posStorage.getPrinterConfig().paperWidth || '58mm';
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('almain_pos_logo_url') || null;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración existente del comercio desde el backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await configuracionService.getConfiguracion();
        if (cfg) {
          if (cfg.nombreComercial) setNombreNegocio(cfg.nombreComercial);
          if (cfg.numeroDocumento) setNumeroRuc(cfg.numeroDocumento);
          if (cfg.telefonoWhatsApp) setTelefonoYape(cfg.telefonoWhatsApp);
          if (cfg.direccion) setDireccion(cfg.direccion);
          if (cfg.textoPieTicket) setMensajePieTicket(cfg.textoPieTicket);
          if (cfg.logoUrl) {
            setLogoUrl(cfg.logoUrl);
            localStorage.setItem('almain_pos_logo_url', cfg.logoUrl);
          }
          if (cfg.anchoTicketMm) setAnchoPapel(cfg.anchoTicketMm === 80 ? '80mm' : '58mm');
        }
      } catch (err) {
        console.warn('Error cargando configuración del tenant:', err);
      }
    };

    loadConfig();
  }, []);

  // Manejo de carga de imagen de logo del negocio
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido (.png, .jpg, .webp)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El tamaño de la imagen no debe superar los 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
      toast.success('Logo seleccionado. Haz clic en "Guardar Configuración" para confirmar.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo removido');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await configuracionService.updateConfiguracion({
        nombreComercial: nombreNegocio.trim(),
        numeroDocumento: numeroRuc.trim(),
        direccion: direccion.trim(),
        telefonoWhatsApp: telefonoYape.trim(),
        textoPieTicket: mensajePieTicket.trim(),
        logoUrl: logoUrl || '',
        anchoTicketMm: anchoPapel === '80mm' ? 80 : 58,
      });

      localStorage.setItem('almain_pos_business_name', nombreNegocio);
      localStorage.setItem('almain_pos_ruc', numeroRuc);
      localStorage.setItem('almain_pos_address', direccion);
      localStorage.setItem('almain_pos_yape_phone', telefonoYape);
      localStorage.setItem('almain_pos_yape_owner', titularYape);
      localStorage.setItem('almain_pos_ticket_footer', mensajePieTicket);
      if (logoUrl) {
        localStorage.setItem('almain_pos_logo_url', logoUrl);
      } else {
        localStorage.removeItem('almain_pos_logo_url');
      }

      posStorage.setPrinterConfig({
        ...posStorage.getPrinterConfig(),
        paperWidth: anchoPapel,
      });

      toast.success('¡Configuración comercial y logo guardados correctamente!');
    } catch (err: unknown) {
      console.error('Error guardando configuración:', err);
      toast.error('No se pudo guardar la configuración en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = async () => {
    const comercio = (nombreNegocio || user?.nombreEmpresa || 'Bodega Don Pepe').trim();

    toast.success('Enviando ticket de prueba a ticketera térmica...');

    await printThermalReceipt({
      logoUrl,
      nombreComercial: comercio,
      rucOIdentificacion: numeroRuc,
      direccion: direccion || 'Dirección de Prueba',
      telefono: telefonoYape,
      tipoComprobante: 'NOTA DE VENTA',
      numeroComprobante: 'TEST-0001',
      fecha: new Date(),
      cajero: titularYape || user?.nombre || 'Administrador',
      items: [
        { cantidad: 1, nombre: 'Prueba de Impresión Térmica', precioUnitario: 1.0, subtotal: 1.0 },
      ],
      total: 1.0,
      metodoPago: 'Efectivo',
      montoRecibido: 1.0,
      vuelto: 0.0,
      textoPieTicket: '¡Tiketera conectada correctamente!',
      anchoPapel,
    });
  };

  return (
    <div className="space-y-4 pb-16">
      <div>
        <h2 className="text-xl font-black text-slate-800">Ajustes & Ticketera</h2>
        <p className="text-xs font-semibold text-slate-500">
          Personalización del negocio, logotipo y comprobantes de venta
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* SECCIÓN 1: LOGOTIPO DEL NEGOCIO (REFERENCIA IMAGEN 1) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wide">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>Logotipo del Negocio (Para Tickets Térmicos)</span>
          </div>

          <p className="text-xs text-slate-500">
            Cada comercio puede cargar su propio logotipo. Se imprimirá centrado en la parte superior de cada ticket de venta (58mm / 80mm).
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* Contenedor de Vista Previa del Logo */}
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2 text-center shrink-0 relative overflow-hidden shadow-inner">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo del negocio"
                  className="w-full h-full object-contain filter grayscale contrast-125"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-1 font-black text-xs">
                    Tu Logo
                  </div>
                  <span className="text-[10px] font-bold">Sin logo</span>
                </div>
              )}
            </div>

            {/* Acciones para Subir o Quitar */}
            <div className="space-y-2 flex-1 w-full text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload-input"
              />
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="w-4 h-4" />}
                >
                  {logoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Quitar Logo
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Formatos recomendados: PNG, JPG o WEBP con fondo blanco o transparente.
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DATOS DEL COMERCIO */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wide">
            <Store className="w-4 h-4 text-red-500" />
            <span>Datos del Comercio</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Nombre Comercial</label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-semibold text-slate-800 focus:bg-white focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">RUC o DNI</label>
              <input
                type="text"
                value={numeroRuc}
                onChange={(e) => setNumeroRuc(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-mono focus:bg-white focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Dirección de la Bodega / Tienda</label>
              <div className="relative flex items-center mt-1">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="ej: Calle 888, Lima"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: QR COBRO MÓVIL (YAPE / PLIN) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-purple-700 uppercase tracking-wide">
            <QrCode className="w-4 h-4 text-purple-600" />
            <span>Datos Yape / Plin</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Número de Celular para Cobros</label>
            <div className="relative flex items-center mt-1">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="tel"
                value={telefonoYape}
                onChange={(e) => setTelefonoYape(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-mono focus:bg-white focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Nombre del Titular de la Cuenta</label>
            <input
              type="text"
              value={titularYape}
              onChange={(e) => setTitularYape(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none focus:bg-white focus:border-purple-500"
            />
          </div>
        </div>

        {/* SECCIÓN 4: FORMATO DE TICKETERA TÉRMICA */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wide">
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Formato de Ticket Térmico</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Ancho de Papel (Ticketera)</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAnchoPapel('58mm')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  anchoPapel === '58mm'
                    ? 'border-red-500 bg-red-50 text-red-600 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                58 mm (Estándar POS Portátil)
              </button>
              <button
                type="button"
                onClick={() => setAnchoPapel('80mm')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  anchoPapel === '80mm'
                    ? 'border-red-500 bg-red-50 text-red-600 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                80 mm (Ticketera de Mostrador)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Mensaje de Pie de Página del Ticket</label>
            <input
              type="text"
              value={mensajePieTicket}
              onChange={(e) => setMensajePieTicket(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none focus:bg-white focus:border-red-500"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={handleTestPrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Imprimir Ticket de Prueba con Logo
          </Button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSaving}
          className="shadow-red-500/25"
        >
          GUARDAR CONFIGURACIÓN DEL NEGOCIO
        </Button>
      </form>
    </div>
  );
};
export default SettingsScreen;
