import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from '@/components/navigation/TopHeader';
import { FloatingBottomDock } from '@/components/navigation/FloatingBottomDock';
import { DarkDrawer } from '@/components/navigation/DarkDrawer';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { signalRService } from '@/services/signalrService';

interface MobileAppLayoutProps {
  onOpenCartSheet?: () => void;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ onOpenCartSheet }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Iniciar conexión SignalR en segundo plano para todo el layout autenticado
  useEffect(() => {
    signalRService.start();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-100 flex flex-col lg:flex-row">
      {/* 1. SIDEBAR EXCLUSIVO PARA PC Y TABLETS GRANDES (>= 1024px) */}
      <DesktopSidebar />

      {/* 2. ÁREA PRINCIPAL ADAPTATIVA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] relative">
        <div className="w-full max-w-md mx-auto lg:max-w-none flex flex-col flex-1 min-h-[100dvh]">
          {/* Top Header */}
          <TopHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

          {/* Main Viewport Content */}
          <main className="flex-1 pb-24 lg:pb-8 px-4 lg:px-6 py-4 overflow-x-hidden">
            <Outlet />
          </main>

          {/* Floating Bottom Dock (Exclusivo para móviles, en PC se usa el Sidebar) */}
          <div className="block lg:hidden">
            <FloatingBottomDock
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenCartSheet={onOpenCartSheet}
            />
          </div>

          {/* Dark Sidebar Drawer (Menú deslizante para móviles) */}
          <DarkDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileAppLayout;
