import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductPaginationProps {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  isLoading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  pagina,
  totalPaginas,
  totalRegistros,
  isLoading,
  onPrevPage,
  onNextPage,
}) => {
  if (totalPaginas <= 1) return null;

  return (
    <div className="pt-3 pb-1 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
      <span className="text-[11px] font-bold text-slate-500">
        Página {pagina} de {totalPaginas} ({totalRegistros} productos)
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={pagina <= 1 || isLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>
        <button
          type="button"
          onClick={onNextPage}
          disabled={pagina >= totalPaginas || isLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
