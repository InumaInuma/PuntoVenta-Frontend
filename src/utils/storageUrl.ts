/**
 * Resuelve la URL pública para una imagen o recurso (Cloudflare R2, CDN, URL absoluta o DataURI).
 * - Si es data URI o ya es URL absoluta (http/https), se devuelve tal cual.
 * - Si es ruta relativa (ej: "metodosPago/qryape.webp"), se antepone VITE_STORAGE_URL si está configurado.
 */
export function getStorageUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = (import.meta.env.VITE_STORAGE_URL as string | undefined)?.replace(/\/+$/, '') || '';
  if (baseUrl) {
    return `${baseUrl}/${trimmed.replace(/^\/+/, '')}`;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
