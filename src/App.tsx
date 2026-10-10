import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { MobileAppLayout } from '@/layouts/MobileAppLayout';

// Pantallas
import { LoginScreen } from '@/features/auth/LoginScreen';
import { PosScreen } from '@/features/pos/PosScreen';
import { ProductsScreen } from '@/features/products/ProductsScreen';
import { CustomersScreen } from '@/features/customers/CustomersScreen';
import { CashManagementScreen } from '@/features/cash/CashManagementScreen';
import { SalesHistoryScreen } from '@/features/history/SalesHistoryScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { SuperAdminDashboard } from '@/features/admin/SuperAdminDashboard';

import { ROUTES } from '@/config/routes';

// Ruta protegida general
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-100">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

// Ruta protegida exclusiva para Super Administrador de la Plataforma
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const isSuperAdmin = (user?.rol || '').toUpperCase() === 'SUPERADMIN';
  if (!isSuperAdmin) {
    return <Navigate to={ROUTES.POS} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#18181b',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginScreen />} />

            {/* Rutas de la Aplicación Móvil */}
            <Route
              path={ROUTES.POS}
              element={
                <ProtectedRoute>
                  <MobileAppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PosScreen />} />
              <Route path={ROUTES.PRODUCTOS.replace('/', '')} element={<ProductsScreen />} />
              <Route path={ROUTES.CLIENTES.replace('/', '')} element={<CustomersScreen />} />
              <Route path={ROUTES.CAJA.replace('/', '')} element={<CashManagementScreen />} />
              <Route path={ROUTES.HISTORIAL.replace('/', '')} element={<SalesHistoryScreen />} />
              <Route path={ROUTES.CONFIGURACION.replace('/', '')} element={<SettingsScreen />} />
            </Route>

            {/* Ruta del Panel Super Administrador (Gestión de Comercios SaaS) */}
            <Route
              path={ROUTES.ADMIN}
              element={
                <AdminRoute>
                  <SuperAdminDashboard />
                </AdminRoute>
              }
            />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to={ROUTES.POS} replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
