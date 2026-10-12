import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

interface CustomersHeaderProps {
  onOpenCreate: () => void;
}

export const CustomersHeader: React.FC<CustomersHeaderProps> = ({ onOpenCreate }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-800">Clientes & Fiados</h2>
        <p className="text-xs font-semibold text-slate-500">
          Control de cuentas caseras y cobranzas
        </p>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={onOpenCreate}
        icon={<Plus className="w-4 h-4 stroke-[3]" />}
      >
        NUEVO CASERO
      </Button>
    </div>
  );
};
