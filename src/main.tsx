import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Registro de Service Worker para PWA (Android, iOS y Escritorio)
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Almain POS PWA] Service Worker activo:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Almain POS PWA] Fallo registro de Service Worker:', err);
      });
  });
}

// Garantizar almacenamiento persistente en navegadores móviles (evita que el SO limpie la sesión)
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((isPersisted) => {
    if (isPersisted) {
      console.log('[Almain POS PWA] Almacenamiento persistente garantizado por el navegador.');
    }
  }).catch(() => {});
}

