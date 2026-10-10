import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ItemCarrito, Producto } from '@/types';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import toast from 'react-hot-toast';

interface CartContextType {
  items: ItemCarrito[];
  itemCount: number;
  total: number;
  subtotal: number;
  impuesto: number;
  addItem: (producto: Producto, cantidad?: number) => void;
  updateQuantity: (idProducto: number, delta: number) => void;
  setExactQuantity: (idProducto: number, cantidad: number) => void;
  removeItem: (idProducto: number) => void;
  clearCart: () => void;
  playBeep: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const { playBeep } = useSound();
  const { triggerTap } = useHaptics();

  const handleFeedback = useCallback(() => {
    playBeep();
    triggerTap();
  }, [playBeep, triggerTap]);

  const addItem = useCallback((producto: Producto, cantidad: number = 1) => {
    if (!producto.activo) {
      toast.error('Este producto está inactivo');
      return;
    }

    handleFeedback();

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.producto.idProducto === producto.idProducto);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const current = updated[existingIndex];
        const newQty = Number((current.cantidad + cantidad).toFixed(3));
        const subtotal = Number((newQty * current.precioUnitario).toFixed(2));

        updated[existingIndex] = {
          ...current,
          cantidad: newQty,
          subtotal,
        };
        return updated;
      } else {
        const subtotal = Number((cantidad * producto.precioVenta).toFixed(2));
        return [
          {
            producto,
            cantidad,
            precioUnitario: producto.precioVenta,
            subtotal,
          },
          ...prevItems,
        ];
      }
    });
  }, []);

  const updateQuantity = useCallback((idProducto: number, delta: number) => {
    setItems((prevItems) => {
      return prevItems
        .map((it) => {
          if (it.producto.idProducto === idProducto) {
            const step = it.producto.permiteDecimales ? (Math.abs(delta) < 1 ? delta : delta > 0 ? 0.25 : -0.25) : delta;
            const newQty = Number((it.cantidad + step).toFixed(3));
            if (newQty <= 0) return null;
            return {
              ...it,
              cantidad: newQty,
              subtotal: Number((newQty * it.precioUnitario).toFixed(2)),
            };
          }
          return it;
        })
        .filter((it): it is ItemCarrito => it !== null);
    });
  }, []);

  const setExactQuantity = useCallback((idProducto: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeItem(idProducto);
      return;
    }

    setItems((prevItems) => {
      return prevItems.map((it) => {
        if (it.producto.idProducto === idProducto) {
          const cleanQty = Number(cantidad.toFixed(3));
          return {
            ...it,
            cantidad: cleanQty,
            subtotal: Number((cleanQty * it.precioUnitario).toFixed(2)),
          };
        }
        return it;
      });
    });
  }, []);

  const removeItem = useCallback((idProducto: number) => {
    setItems((prevItems) => prevItems.filter((it) => it.producto.idProducto !== idProducto));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const { total, subtotal, impuesto, itemCount } = useMemo(() => {
    const rawTotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const roundedTotal = Number(rawTotal.toFixed(2));
    // Asumiendo precios con IGV incluido o calculando desglose estándar
    const base = Number((roundedTotal / 1.18).toFixed(2));
    const igv = Number((roundedTotal - base).toFixed(2));
    const count = items.reduce((acc, it) => acc + (it.producto.permiteDecimales ? 1 : it.cantidad), 0);

    return {
      total: roundedTotal,
      subtotal: base,
      impuesto: igv,
      itemCount: Math.round(count),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        subtotal,
        impuesto,
        addItem,
        updateQuantity,
        setExactQuantity,
        removeItem,
        clearCart,
        playBeep,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};
