import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Printer, Store, QrCode, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsScreen: React.FC = () => {
  const { user } = useAuth();

  const [nombreNegocio, setNombreNegocio] = useState(user?.nombreEmpresa || 'Bodega Almain');
  const [numeroRuc, setNumeroRuc] = useState('20601234567');
  const [telefonoYape, setTelefonoYape] = useState('987654321');
  const [titularYape, setTitularYape] = useState(user?.nombre || 'Juan Pérez');
  const [mensajePieTicket, setMensajePieTicket] = useState('¡Gracias por su preferencia!');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Configuración guardada localmente');
  };

  const handleTestPrint = () => {
    toast.success('Enviando página de prueba a impresora térmica...');
    window.print();
  };

  return (
    <div className="space-y-4 pb-16">
      <div>
        <h2 className="text-xl font-black text-slate-800">Ajustes & Ticketera</h2>
        <p className="text-xs font-semibold text-slate-500">
          Personalización del negocio y comprobantes
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Datos Comerciales */}
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
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">RUC o DNI</label>
            <input
              type="text"
              value={numeroRuc}
              onChange={(e) => setNumeroRuc(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
            />
          </div>
        </div>

        {/* QR Cobro Móvil (Yape / Plin) */}
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
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Nombre del Titular de la Cuenta</label>
            <input
              type="text"
              value={titularYape}
              onChange={(e) => setTitularYape(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
            />
          </div>
        </div>

        {/* Ticketera Térmica */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wide">
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Formato de Ticket Térmico</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Mensaje de Pie de Página</label>
            <input
              type="text"
              value={mensajePieTicket}
              onChange={(e) => setMensajePieTicket(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
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
            Imprimir Ticket de Prueba
          </Button>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth>
          GUARDAR CONFIGURACIÓN
        </Button>
      </form>
    </div>
  );
};
