import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from '@/components/navigation/TopHeader';
import { FloatingBottomDock } from '@/components/navigation/FloatingBottomDock';
import { DarkDrawer } from '@/components/navigation/DarkDrawer';

interface MobileAppLayoutProps {
  onOpenCartSheet?: () => void;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ onOpenCartSheet }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-100 text-slate-800 relative">
      {/* Top Header */}
      <TopHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Main Viewport Content */}
      <main className="flex-1 pb-24 overflow-x-hidden">
        <div className="max-w-md mx-auto px-4 py-3">
          <Outlet />
        </div>
      </main>

      {/* Bottom Dock */}
      <FloatingBottomDock
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenCartSheet={onOpenCartSheet}
      />

      {/* Dark Sidebar Drawer */}
      <DarkDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
