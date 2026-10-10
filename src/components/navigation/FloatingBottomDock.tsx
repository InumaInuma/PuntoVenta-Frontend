import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScanLine, Package, ShoppingCart, Landmark, Menu } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ROUTES } from '@/config/routes';

interface FloatingBottomDockProps {
  onOpenDrawer: () => void;
  onOpenCartSheet?: () => void;
}

export const FloatingBottomDock: React.FC<FloatingBottomDockProps> = ({
  onOpenDrawer,
  onOpenCartSheet,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 safe-bottom">
      <div className="max-w-md mx-auto px-4 h-[68px] flex items-center justify-between relative">
        {/* 1. Ventas */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.POS)}
          className={`flex flex-col items-center justify-center w-14 h-full cursor-pointer transition-all active:scale-95 ${
            isActive(ROUTES.POS) ? 'text-red-500 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ScanLine className={`w-6 h-6 ${isActive(ROUTES.POS) ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[11px] mt-1 font-semibold">Ventas</span>
        </button>

        {/* 2. Catálogo */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.PRODUCTOS)}
          className={`flex flex-col items-center justify-center w-14 h-full cursor-pointer transition-all active:scale-95 ${
            isActive(ROUTES.PRODUCTOS) ? 'text-red-500 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className={`w-6 h-6 ${isActive(ROUTES.PRODUCTOS) ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[11px] mt-1 font-semibold">Catálogo</span>
        </button>

        {/* 3. BOTÓN CENTRAL ELEVADO: Cobrar */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              if (onOpenCartSheet) {
                onOpenCartSheet();
              } else {
                navigate(ROUTES.POS);
              }
            }}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white ring-4 ring-white shadow-xl shadow-red-500/40 flex items-center justify-center transition-all cursor-pointer relative"
          >
            <ShoppingCart className="w-7 h-7 stroke-[2.4]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-full ring-2 ring-white flex items-center justify-center animate-bounce">
                {itemCount}
              </span>
            )}
          </button>
          <span className="text-[11px] font-extrabold text-red-600 mt-1">
            Cobrar
          </span>
        </div>

        {/* 4. Caja */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.CAJA)}
          className={`flex flex-col items-center justify-center w-14 h-full cursor-pointer transition-all active:scale-95 ${
            isActive(ROUTES.CAJA) ? 'text-red-500 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className={`w-6 h-6 ${isActive(ROUTES.CAJA) ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[11px] mt-1 font-semibold">Caja</span>
        </button>

        {/* 5. Menú */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center w-14 h-full text-slate-500 hover:text-slate-800 cursor-pointer transition-all active:scale-95"
        >
          <Menu className="w-6 h-6 stroke-[1.9]" />
          <span className="text-[11px] mt-1 font-semibold">Menú</span>
        </button>
      </div>
    </nav>
  );
};
