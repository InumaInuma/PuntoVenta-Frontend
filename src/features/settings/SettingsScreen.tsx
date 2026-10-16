import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { 
  Printer, 
  Store, 
  QrCode, 
  Smartphone, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  MapPin, 
  Globe, 
  Check, 
  Plus, 
  Edit3, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { posStorage } from '@/services/storage/pos.storage';
import { configuracionService, type PaisConfig } from '@/services/backend/configuracionService';
import { printThermalReceipt } from '@/services/printer/thermalReceiptService';
import { saveCachedTenantCountry } from '@/utils/countryHelper';
import { getStorageUrl } from '@/utils/storageUrl';
import { comprimirAWebP } from '@/utils/imageCompressor';
import type { MetodoPago } from '@/types';

export const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const walletQrInputRef = useRef<HTMLInputElement>(null);

  const [paises, setPaises] = useState<PaisConfig[]>([]);
  const [selectedPaisId, setSelectedPaisId] = useState<number>(1);

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
  const [titularYape] = useState(() => {
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

  // Estados para Billeteras Digitales y Códigos QR
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [selectedWalletQRPreview, setSelectedWalletQRPreview] = useState<{ nombre: string; url: string } | null>(null);
  const [walletForm, setWalletForm] = useState<{
    id?: number;
    codigoMetodo: string;
    nombreMostrado: string;
    numeroTitular: string;
    nombreTitular: string;
    imagenQRUrl: string;
    requiereComprobanteRef: boolean;
    activo: boolean;
  }>({
    codigoMetodo: 'YAPE',
    nombreMostrado: '',
    numeroTitular: '',
    nombreTitular: '',
    imagenQRUrl: '',
    requiereComprobanteRef: true,
    activo: true,
  });

  const selectedPais = paises.find((p) => p.id === selectedPaisId) || paises[0];

  // Cargar configuración existente del comercio y catálogo de países desde el backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [cfg, paisesList, metodosList] = await Promise.all([
          configuracionService.getConfiguracion(),
          configuracionService.getPaises(),
          configuracionService.getMetodosPago(),
        ]);
        if (paisesList && paisesList.length > 0) {
          setPaises(paisesList);
        }
        if (metodosList) {
          setMetodosPago(metodosList);
        }
        if (cfg) {
          saveCachedTenantCountry({
            codigoIso: cfg.codigoIso,
            codigoTelefonico: cfg.codigoTelefonico,
            monedaSimbolo: cfg.monedaSimbolo,
            monedaCodigo: cfg.monedaCodigo,
            paisNombre: cfg.paisNombre,
          });
          if (cfg.idPais) setSelectedPaisId(cfg.idPais);
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
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido (.png, .jpg, .webp)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('El tamaño de la imagen no debe superar los 15 MB');
      return;
    }

    try {
      const webpDataUrl = await comprimirAWebP(file, 800, 0.85);
      setLogoUrl(webpDataUrl);
      toast.success('Logo optimizado en formato WebP. Haz clic en "Guardar Configuración".');
    } catch {
      toast.error('Error al procesar y optimizar el logotipo');
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo removido');
  };

  // Manejo de Billeteras Digitales y Códigos QR
  const handleToggleMetodo = async (metodo: MetodoPago) => {
    const id = metodo.id || metodo.idMetodoPago;
    const nuevoActivo = !metodo.activo;
    try {
      await configuracionService.updateMetodoPago(id, {
        ...metodo,
        activo: nuevoActivo,
      });
      setMetodosPago((prev) =>
        prev.map((m) => ((m.id || m.idMetodoPago) === id ? { ...m, activo: nuevoActivo } : m))
      );
      toast.success(`${metodo.nombreMostrado || metodo.nombre} ${nuevoActivo ? 'activada' : 'desactivada'}`);
    } catch {
      toast.error('No se pudo actualizar el estado de la billetera.');
    }
  };

  const handleOpenNewWalletModal = () => {
    setWalletForm({
      codigoMetodo: 'YAPE',
      nombreMostrado: '',
      numeroTitular: '',
      nombreTitular: '',
      imagenQRUrl: '',
      requiereComprobanteRef: true,
      activo: true,
    });
    setIsWalletModalOpen(true);
  };

  const handleOpenEditWalletModal = (m: MetodoPago) => {
    setWalletForm({
      id: m.id || m.idMetodoPago,
      codigoMetodo: m.codigoMetodo || m.codigo || 'BILLETERA',
      nombreMostrado: m.nombreMostrado || m.nombre,
      numeroTitular: m.numeroTitular || '',
      nombreTitular: m.nombreTitular || '',
      imagenQRUrl: m.imagenQRUrl || '',
      requiereComprobanteRef: m.requiereComprobanteRef ?? true,
      activo: m.activo,
    });
    setIsWalletModalOpen(true);
  };

  const handleQrFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida (.jpg, .png, .webp)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 15 MB');
      return;
    }

    try {
      const webpDataUrl = await comprimirAWebP(file, 800, 0.85);
      setWalletForm((prev) => ({
        ...prev,
        imagenQRUrl: webpDataUrl,
      }));
      toast.success('Código QR optimizado en formato WebP.');
    } catch {
      toast.error('Error al procesar el código QR');
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletForm.nombreMostrado.trim()) {
      toast.error('Ingresa el nombre de la billetera digital.');
      return;
    }

    setIsSavingWallet(true);
    try {
      if (walletForm.id) {
        await configuracionService.updateMetodoPago(walletForm.id, {
          nombreMostrado: walletForm.nombreMostrado.trim(),
          numeroTitular: walletForm.numeroTitular.trim() || undefined,
          nombreTitular: walletForm.nombreTitular.trim() || undefined,
          imagenQRUrl: walletForm.imagenQRUrl.trim() || undefined,
          requiereComprobanteRef: walletForm.requiereComprobanteRef,
          activo: walletForm.activo,
        });
        toast.success('Billetera digital actualizada.');
      } else {
        await configuracionService.createMetodoPago({
          codigoMetodo: walletForm.codigoMetodo,
          nombreMostrado: walletForm.nombreMostrado.trim(),
          numeroTitular: walletForm.numeroTitular.trim() || undefined,
          nombreTitular: walletForm.nombreTitular.trim() || undefined,
          imagenQRUrl: walletForm.imagenQRUrl.trim() || undefined,
          requiereComprobanteRef: walletForm.requiereComprobanteRef,
          activo: walletForm.activo,
        });
        toast.success('Nueva billetera digital creada con éxito.');
      }

      const listaActualizada = await configuracionService.getMetodosPago();
      setMetodosPago(listaActualizada);
      setIsWalletModalOpen(false);
    } catch {
      toast.error('Ocurrió un error al guardar la billetera digital.');
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleDeleteWallet = async (wallet: MetodoPago) => {
    const id = wallet.id || wallet.idMetodoPago;
    const nombre = wallet.nombreMostrado || wallet.nombre;
    if (!window.confirm(`¿Estás seguro de eliminar la billetera "${nombre}"?`)) return;

    try {
      await configuracionService.deleteMetodoPago(id);
      setMetodosPago((prev) => prev.filter((m) => (m.id || m.idMetodoPago) !== id));
      toast.success(`Billetera "${nombre}" eliminada.`);
    } catch {
      toast.error('No se pudo eliminar la billetera.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await configuracionService.updateConfiguracion({
        idPais: selectedPaisId,
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

        {/* SECCIÓN 2: PAÍS, MONEDA Y ZONA HORARIA */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-blue-700 uppercase tracking-wide">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>País, Moneda & Zona Horaria (SaaS Internacional)</span>
          </div>

          <p className="text-xs text-slate-500">
            Selecciona el país de tu comercio. La plataforma aplicará automáticamente la moneda oficial, el huso horario local para ventas y cierres de caja (evitando desfases), y el prefijo telefónico.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">País de Operación</label>
              <select
                value={selectedPaisId}
                onChange={(e) => setSelectedPaisId(Number(e.target.value))}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-bold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                {paises.length === 0 ? (
                  <option value={1}>🇵🇪 Perú — Sol (S/ PEN)</option>
                ) : (
                  paises.map((p) => {
                    const flag =
                      p.codigoIso === 'PE' ? '🇵🇪' :
                      p.codigoIso === 'BO' ? '🇧🇴' :
                      p.codigoIso === 'CO' ? '🇨🇴' :
                      p.codigoIso === 'CL' ? '🇨🇱' :
                      p.codigoIso === 'MX' ? '🇲🇽' :
                      p.codigoIso === 'EC' ? '🇪🇨' : '🌍';
                    return (
                      <option key={p.id} value={p.id}>
                        {flag} {p.nombre} — {p.monedaNombre} ({p.monedaSimbolo} {p.monedaCodigo})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Badges de Información del País Seleccionado */}
            {selectedPais && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex flex-col justify-center space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Moneda del Sistema:</span>
                  <span className="font-black text-blue-800 bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                    {selectedPais.monedaNombre} ({selectedPais.monedaSimbolo} {selectedPais.monedaCodigo})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Zona Horaria Oficial:</span>
                  <span className="font-bold text-slate-800 font-mono text-[11px] bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                    {selectedPais.zonaHorariaIana || selectedPais.zonaHorariaWindows}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Prefijo WhatsApp:</span>
                  <span className="font-bold text-emerald-700 font-mono text-[11px] bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                    +{selectedPais.codigoTelefonico}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 font-medium">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <b>Control Horario Profesional:</b> Las ventas, cotizaciones y arqueos de caja se sincronizarán con la hora oficial de <b>{selectedPais?.nombre || 'tu país'}</b> sin horas de desfase.
            </span>
          </div>
        </div>

        {/* SECCIÓN 3: DATOS DEL COMERCIO */}
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

        {/* SECCIÓN 3: BILLETERAS DIGITALES Y CÓDIGOS QR (YAPE, PLIN, ETC.) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-purple-900 uppercase tracking-wide">
                  Billeteras Digitales y Códigos QR
                </h3>
                <p className="text-[11px] text-slate-500">
                  Agrega las billeteras con que trabajas (Yape, Plin, etc.) y adjunta sus códigos QR para el cobro.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenNewWalletModal}
              className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-purple-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Billetera</span>
            </button>
          </div>

          {/* Listado de Billeteras */}
          <div className="space-y-3">
            {metodosPago
              .filter((m) =>
                ['YAPE', 'PLIN', 'BILLETERA', 'MERCADOPAGO', 'TUNKI', 'TRANSFERENCIA'].includes(
                  (m.codigoMetodo || m.codigo || '').toUpperCase()
                )
              )
              .map((billetera) => {
                const id = billetera.id || billetera.idMetodoPago;
                const cod = (billetera.codigoMetodo || billetera.codigo || '').toUpperCase();
                const isYape = cod === 'YAPE';
                const isPlin = cod === 'PLIN';

                return (
                  <div
                    key={id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      billetera.activo
                        ? isYape
                          ? 'bg-purple-50/40 border-purple-200/80 shadow-xs'
                          : isPlin
                          ? 'bg-cyan-50/40 border-cyan-200/80 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 shadow-xs'
                        : 'bg-slate-50/30 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {/* Información de la billetera */}
                      <div className="flex items-start gap-3 flex-1">
                        {/* Miniatura QR */}
                        <div
                          onClick={() => {
                            if (billetera.imagenQRUrl) {
                              setSelectedWalletQRPreview({
                                nombre: billetera.nombreMostrado || billetera.nombre,
                                url: getStorageUrl(billetera.imagenQRUrl),
                              });
                            } else {
                              handleOpenEditWalletModal(billetera);
                            }
                          }}
                          className={`w-18 h-18 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all border ${
                            billetera.imagenQRUrl
                              ? 'bg-white border-purple-200 hover:border-purple-500 hover:scale-105 shadow-xs'
                              : 'bg-white/80 border-dashed border-slate-300 hover:border-purple-400'
                          }`}
                          title={billetera.imagenQRUrl ? 'Clic para ampliar QR' : 'Clic para adjuntar QR'}
                        >
                          {billetera.imagenQRUrl ? (
                            <img
                              src={getStorageUrl(billetera.imagenQRUrl)}
                              alt="QR"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <QrCode className="w-6 h-6 mb-0.5 text-slate-300" />
                              <span className="text-[9px] font-bold text-slate-400">Sin QR</span>
                            </div>
                          )}
                        </div>

                        {/* Datos de la cuenta */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                                isYape
                                  ? 'bg-purple-600 text-white'
                                  : isPlin
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-indigo-600 text-white'
                              }`}
                            >
                              {cod}
                            </span>
                            <h4 className="font-bold text-sm text-slate-800">
                              {billetera.nombreMostrado || billetera.nombre}
                            </h4>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {billetera.numeroTitular && (
                              <span className="font-mono font-semibold flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                {billetera.numeroTitular}
                              </span>
                            )}
                            {billetera.nombreTitular && (
                              <span className="text-slate-500">
                                Titular: <strong className="text-slate-700">{billetera.nombreTitular}</strong>
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                            <span>
                              {billetera.requiereComprobanteRef
                                ? '• Pide N° operación'
                                : '• N° operación opcional'}
                            </span>
                            <span>•</span>
                            <span>{billetera.imagenQRUrl ? 'QR adjunto ✓' : 'Falta adjuntar QR'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones de la billetera */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleMetodo(billetera)}
                          className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            billetera.activo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {billetera.activo ? 'Activa' : 'Inactiva'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditWalletModal(billetera)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-all"
                          title="Editar Billetera"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWallet(billetera)}
                          className="p-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 cursor-pointer transition-all"
                          title="Eliminar Billetera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {metodosPago.filter((m) =>
              ['YAPE', 'PLIN', 'BILLETERA', 'MERCADOPAGO', 'TUNKI', 'TRANSFERENCIA'].includes(
                (m.codigoMetodo || m.codigo || '').toUpperCase()
              )
            ).length === 0 && (
              <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
                <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No tienes billeteras digitales configuradas</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Haz clic en "Agregar Billetera" para registrar tu Yape, Plin o billetera con su QR.
                </p>
              </div>
            )}
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

      {/* MODAL: AGREGAR O EDITAR BILLETERA DIGITAL Y QR */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {walletForm.id ? 'Editar Billetera Digital' : 'Nueva Billetera Digital'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configura los datos de cobro y adjunta la imagen de tu QR.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Tipo de Billetera */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Tipo de Billetera</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: 'YAPE', label: 'Yape', color: 'border-purple-500 bg-purple-50 text-purple-700' },
                    { id: 'PLIN', label: 'Plin', color: 'border-cyan-500 bg-cyan-50 text-cyan-700' },
                    { id: 'BILLETERA', label: 'Otra', color: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
                  ].map((tipo) => {
                    const isSelected = walletForm.codigoMetodo === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => {
                          setWalletForm((prev) => ({
                            ...prev,
                            codigoMetodo: tipo.id,
                            nombreMostrado:
                              prev.nombreMostrado ||
                              (tipo.id === 'YAPE'
                                ? 'Yape'
                                : tipo.id === 'PLIN'
                                ? 'Plin'
                                : 'Billetera Digital'),
                          }));
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? tipo.color + ' ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tipo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nombre Mostrado */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nombre a Mostrar al Vender
                </label>
                <input
                  type="text"
                  placeholder="ej: Yape Don Pepe, Plin Tienda"
                  value={walletForm.nombreMostrado}
                  onChange={(e) =>
                    setWalletForm((prev) => ({ ...prev, nombreMostrado: e.target.value }))
                  }
                  required
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-medium focus:bg-white focus:border-purple-500"
                />
              </div>

              {/* Celular y Titular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">N° de Celular</label>
                  <div className="relative flex items-center mt-1">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="tel"
                      placeholder="ej: 987654321"
                      value={walletForm.numeroTitular}
                      onChange={(e) =>
                        setWalletForm((prev) => ({ ...prev, numeroTitular: e.target.value }))
                      }
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none font-mono focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Nombre del Titular</label>
                  <input
                    type="text"
                    placeholder="ej: José Quispe"
                    value={walletForm.nombreTitular}
                    onChange={(e) =>
                      setWalletForm((prev) => ({ ...prev, nombreTitular: e.target.value }))
                    }
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>

              {/* IMAGEN DEL CÓDIGO QR */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <span>Código QR de la Billetera</span>
                  </label>
                  {walletForm.imagenQRUrl && (
                    <button
                      type="button"
                      onClick={() => setWalletForm((prev) => ({ ...prev, imagenQRUrl: '' }))}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Quitar QR
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Vista Previa */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
                    {walletForm.imagenQRUrl ? (
                      <img
                        src={getStorageUrl(walletForm.imagenQRUrl)}
                        alt="Preview QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-300">
                        <QrCode className="w-8 h-8 mx-auto" />
                        <span className="text-[9px] font-bold">Sin Imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones de carga de QR */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={walletQrInputRef}
                      onChange={handleQrFileSelected}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => walletQrInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{walletForm.imagenQRUrl ? 'Cambiar Imagen QR' : 'Subir Foto del QR'}</span>
                    </button>

                    <div>
                      <input
                        type="text"
                        placeholder="O ingresa ruta (ej: metodosPago/qryape.webp)"
                        value={walletForm.imagenQRUrl}
                        onChange={(e) =>
                          setWalletForm((prev) => ({ ...prev, imagenQRUrl: e.target.value }))
                        }
                        className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-[11px] outline-none font-mono text-slate-600 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={walletForm.requiereComprobanteRef}
                    onChange={(e) =>
                      setWalletForm((prev) => ({
                        ...prev,
                        requiereComprobanteRef: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Solicitar N° de Operación en el cobro</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={walletForm.activo}
                    onChange={(e) =>
                      setWalletForm((prev) => ({ ...prev, activo: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Billetera Activa</span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingWallet}
                  className="flex-1 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingWallet ? 'Guardando...' : 'Guardar Billetera'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISTA PREVIA DEL CÓDIGO QR EN ALTA RESOLUCIÓN */}
      {selectedWalletQRPreview && (
        <div
          onClick={() => setSelectedWalletQRPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">
                QR de {selectedWalletQRPreview.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedWalletQRPreview(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-64 h-64 mx-auto bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-center shadow-inner">
              <img
                src={selectedWalletQRPreview.url}
                alt="QR Ampliado"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <p className="text-xs text-slate-500">
              Este es el código QR que verán los clientes para escanear y pagar en caja.
            </p>

            <button
              type="button"
              onClick={() => setSelectedWalletQRPreview(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsScreen;
