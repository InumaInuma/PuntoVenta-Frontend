import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Plus, Tags, LayoutGrid, List, Boxes } from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface ProductsHeaderProps {
  totalRegistros: number;
  onOpenCategories?: () => void;
  onOpenCreate?: () => void;
  viewMode?: 'grid' | 'list';
  onToggleViewMode?: (mode: 'grid' | 'list') => void;
  mode?: 'sale' | 'manage';
  title?: string;
  subtitle?: string;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  totalRegistros,
  onOpenCategories,
  onOpenCreate,
  viewMode = 'grid',
  onToggleViewMode,
  mode = 'sale',
  title,
  subtitle,
}) => {
  const navigate = useNavigate();

  const defaultTitle = mode === 'manage' ? 'Inventario' : 'Catálogo';
  const defaultSubtitle =
    mode === 'manage'
      ? `${totalRegistros} productos registrados`
      : `${totalRegistros} productos • Toca para vender`;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {title || defaultTitle}
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          {subtitle || defaultSubtitle}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle Vista Cuadrícula / Lista */}
        {onToggleViewMode && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Vista cuadrícula (3 columnas)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Vista lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Si estamos en MODO VENTA (Catálogo), botón para ir a Inventario */}
        {mode === 'sale' && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.INVENTARIO)}
            className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Ir a gestión de inventario para crear o editar productos"
          >
            <Boxes className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden xs:inline">Inventario</span>
          </button>
        )}

        {/* Si estamos en MODO GESTIÓN (Inventario), botones de Categorías y Nuevo Producto */}
        {mode === 'manage' && (
          <>
            {onOpenCategories && (
              <button
                type="button"
                onClick={onOpenCategories}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Crear, editar o eliminar categorías"
              >
                <Tags className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xs:inline">Categorías</span>
              </button>
            )}

            {onOpenCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenCreate}
                icon={<Plus className="w-4 h-4 stroke-[3]" />}
              >
                NUEVO
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
