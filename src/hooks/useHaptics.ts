import { useCallback } from 'react';

/**
 * Hook para vibración táctil háptica en smartphones (Android / iOS con soporte PWA)
 */
export const useHaptics = () => {
  const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;

  // Toque suave para teclado numérico o botones (15ms)
  const triggerTap = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  }, [isSupported]);

  // Vibración doble de éxito al cobrar
  const triggerSuccess = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate([25, 40, 35]);
      } catch {}
    }
  }, [isSupported]);

  // Vibración de alerta o error
  const triggerError = useCallback(() => {
    if (isSupported) {
      try {
        navigator.vibrate([70, 50, 70]);
      } catch {}
    }
  }, [isSupported]);

  return { triggerTap, triggerSuccess, triggerError, isSupported };
};
