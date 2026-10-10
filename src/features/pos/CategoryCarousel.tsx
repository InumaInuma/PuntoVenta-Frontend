import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Categoria } from '@/types';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface CategoryCarouselProps {
  categorias: Categoria[];
  totalProductos: number;
  selectedCategoria: number | null;
  onSelectCategoria: (id: number | null) => void;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categorias,
  totalProductos,
  selectedCategoria,
  onSelectCategoria,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Comprobar posición de scroll para mostrar / ocultar flechas de navegación
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categorias, checkScroll]);

  // Desplazamiento suave con flechas
  const handleScrollBy = (distance: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  // Scroll con rueda del mouse horizontal
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollContainerRef.current;
    if (!el || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    el.scrollLeft += e.deltaY * 0.8;
  };

  // Drag con mouse para laptops y desktops
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePillClick = (id: number | null, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectCategoria(id);
    // Centrar suavemente la píldora clickeada
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  return (
    <div className="relative group w-full my-0.5">
      {/* Botón Flecha Izquierda */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScrollBy(-160)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md shadow-slate-900/10 flex items-center justify-center text-slate-700 hover:text-red-600 hover:bg-slate-50 transition-all cursor-pointer -ml-1 active:scale-95"
          title="Ver categorías anteriores"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Degradado lateral izquierdo */}
      {canScrollLeft && (
        <div className="absolute left-0 inset-y-0 w-6 bg-gradient-to-r from-slate-100 to-transparent z-10 pointer-events-none" />
      )}

      {/* Contenedor Carrusel Horizontal */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 -mx-2 px-2 scroll-smooth select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Píldora: Todos los Productos */}
        <button
          type="button"
          onClick={(e) => handlePillClick(null, e)}
          className={`h-9 px-3.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-150 cursor-pointer border flex items-center gap-1.5 shrink-0 ${
            selectedCategoria === null
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/30 scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${selectedCategoria === null ? 'text-red-400' : 'text-slate-400'}`} />
          <span>Todos ({totalProductos})</span>
        </button>

        {/* Píldoras de Categorías */}
        {categorias.map((cat, index) => {
          const isSelected = selectedCategoria === cat.idCategoria;
          return (
            <button
              key={cat.idCategoria || `cat-${index}`}
              type="button"
              onClick={(e) => handlePillClick(cat.idCategoria, e)}
              className={`h-9 px-3.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-150 cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/25 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>{cat.nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Degradado lateral derecho */}
      {canScrollRight && (
        <div className="absolute right-0 inset-y-0 w-6 bg-gradient-to-l from-slate-100 to-transparent z-10 pointer-events-none" />
      )}

      {/* Botón Flecha Derecha */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScrollBy(160)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md shadow-slate-900/10 flex items-center justify-center text-slate-700 hover:text-red-600 hover:bg-slate-50 transition-all cursor-pointer -mr-1 active:scale-95"
          title="Ver más categorías"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

export default CategoryCarousel;
