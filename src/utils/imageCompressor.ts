/**
 * Utilidad de compresión y conversión de imágenes en el cliente (Frontend).
 * Optimizado para dispositivos móviles para evitar picos de memoria (OOM) y reinicios de pestañas:
 * 1. Usa createImageBitmap cuando está disponible (decodificación nativa eficiente en hardware).
 * 2. Usa URL.createObjectURL con revocación inmediata en lugar de FileReader Base64.
 * 3. Redimensiona manteniendo la proporción (máx 800x800 px) y exporta en WebP optimizado (< 100 KB).
 */
export async function comprimirAWebP(file: File | Blob, maxDim = 800, quality = 0.82): Promise<string> {
  // Estrategia 1: createImageBitmap nativo (No infla la memoria JS con bitmaps sin comprimir)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        return dataUrl;
      }
      bitmap.close();
    } catch (bitmapError) {
      console.warn('Fallback de createImageBitmap a Image:', bitmapError);
    }
  }

  // Estrategia 2: URL.createObjectURL con revocación de memoria inmediata
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto 2D del canvas.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Formato de imagen inválido o corrupto.'));
    };

    img.src = objectUrl;
  });
}

