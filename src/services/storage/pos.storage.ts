// Persistencia de Configuración y Estado Rápido del POS (Estándar People)

const POS_STORAGE_KEYS = {
  LAST_CASHIER: 'almain_pos_last_cashier',
  ACTIVE_BRANCH: 'almain_pos_active_branch',
  SAVED_PRINTER_CONFIG: 'almain_pos_printer_cfg',
  CART_DRAFT: 'almain_pos_cart_draft',
} as const;

export interface LastCashierInfo {
  login: string;
}

export interface PrinterConfig {
  paperWidth: '58mm' | '80mm';
  autoPrintOnSale: boolean;
  printLogo: boolean;
}

export const posStorage = {
  getLastCashier: (): LastCashierInfo | null => {
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEYS.LAST_CASHIER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setLastCashier: (info: LastCashierInfo): void => {
    try {
      localStorage.setItem(POS_STORAGE_KEYS.LAST_CASHIER, JSON.stringify(info));
    } catch (e) {
      console.error('Error guardando último cajero:', e);
    }
  },

  getActiveBranch: (): number | null => {
    try {
      const val = localStorage.getItem(POS_STORAGE_KEYS.ACTIVE_BRANCH);
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  },

  setActiveBranch: (idSucursal: number): void => {
    try {
      localStorage.setItem(POS_STORAGE_KEYS.ACTIVE_BRANCH, idSucursal.toString());
    } catch (e) {
      console.error('Error guardando sucursal activa:', e);
    }
  },

  getPrinterConfig: (): PrinterConfig => {
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEYS.SAVED_PRINTER_CONFIG);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      paperWidth: '80mm',
      autoPrintOnSale: true,
      printLogo: true,
    };
  },

  setPrinterConfig: (cfg: PrinterConfig): void => {
    try {
      localStorage.setItem(POS_STORAGE_KEYS.SAVED_PRINTER_CONFIG, JSON.stringify(cfg));
    } catch (e) {
      console.error('Error guardando configuración de impresora:', e);
    }
  },
};
