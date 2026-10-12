import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Tags } from 'lucide-react';

interface ProductsHeaderProps {
  totalRegistros: number;
  onOpenCategories: () => void;
  onOpenCreate: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  totalRegistros,
  onOpenCategories,
  onOpenCreate,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-800">Catálogo & Stock</h2>
        <p className="text-xs font-semibold text-slate-500">
          {totalRegistros} productos registrados
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Gestión de Categorías */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          title="Crear, editar o eliminar categorías"
        >
          <Tags className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden xs:inline">Categorías</span>
        </button>

        {/* Botón Nuevo Producto */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreate}
          icon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          NUEVO
        </Button>
      </div>
    </div>
  );
};
