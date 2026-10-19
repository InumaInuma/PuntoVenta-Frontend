import toast from 'react-hot-toast';

/**
 * Utilidades centralizadas y reutilizables de validación de formularios con alertas Toast.
 * Cumple con los estándares de negocio para Perú (RUC 11 dígitos, DNI 8 dígitos, teléfono 9 dígitos).
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const FormValidators = {
  /**
   * Valida que un campo de texto no esté vacío ni contenga solo espacios en blanco.
   */
  required: (value: string | undefined | null, fieldName: string, minLength = 1): ValidationResult => {
    const trimmed = (value || '').trim();
    if (!trimmed || trimmed.length < minLength) {
      const msg = minLength > 1
        ? `El campo "${fieldName}" debe tener al menos ${minLength} caracteres.`
        : `El campo "${fieldName}" es obligatorio.`;
      return { isValid: false, message: msg };
    }
    return { isValid: true };
  },

  /**
   * Valida un número de RUC peruano (11 dígitos numéricos, usualmente iniciando con 10, 15, 17 o 20).
   */
  ruc: (ruc: string | undefined | null): ValidationResult => {
    const trimmed = (ruc || '').trim();
    if (!trimmed) {
      return { isValid: false, message: 'El número de RUC es obligatorio.' };
    }
    if (!/^\d{11}$/.test(trimmed)) {
      return { isValid: false, message: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
    }
    const prefix = trimmed.substring(0, 2);
    if (!['10', '15', '17', '20'].includes(prefix)) {
      return { isValid: false, message: 'El RUC debe comenzar con 10 (persona natural) o 20 (persona jurídica).' };
    }
    return { isValid: true };
  },

  /**
   * Valida un DNI peruano (8 dígitos numéricos).
   */
  dni: (dni: string | undefined | null): ValidationResult => {
    const trimmed = (dni || '').trim();
    if (!trimmed) {
      return { isValid: false, message: 'El DNI es obligatorio.' };
    }
    if (!/^\d{8}$/.test(trimmed)) {
      return { isValid: false, message: 'El DNI debe tener exactamente 8 dígitos numéricos.' };
    }
    return { isValid: true };
  },

  /**
   * Valida dinámicamente un documento según su tipo (RUC, DNI, CE u Otro/Internacional).
   */
  documento: (tipoDoc: string, numero: string | undefined | null): ValidationResult => {
    const tipo = (tipoDoc || '').toUpperCase();
    if (tipo === 'RUC') {
      return FormValidators.ruc(numero);
    }
    if (tipo === 'DNI') {
      return FormValidators.dni(numero);
    }
    if (tipo === 'CE') {
      const trimmed = (numero || '').trim();
      if (!trimmed) return { isValid: false, message: 'El Carnet de Extranjería es obligatorio.' };
      if (trimmed.length < 8 || trimmed.length > 12) {
        return { isValid: false, message: 'El Carnet de Extranjería debe tener entre 8 y 12 caracteres.' };
      }
      return { isValid: true };
    }
    // Tipo OTRO / INTERNACIONAL (NIT, RUT, Cédula, RFC) - Máximo 20 caracteres por estándar de BD
    const trimmed = (numero || '').trim();
    if (!trimmed) {
      return { isValid: false, message: 'El número de documento de identidad es obligatorio.' };
    }
    if (trimmed.length < 4) {
      return { isValid: false, message: 'El documento debe contener al menos 4 caracteres.' };
    }
    if (trimmed.length > 20) {
      return { isValid: false, message: 'El documento no puede exceder los 20 caracteres.' };
    }
    return { isValid: true };
  },

  /**
   * Valida un número de celular / WhatsApp en Perú (9 dígitos, comenzando con 9).
   */
  telefonoPeru: (telefono: string | undefined | null, requerido = true): ValidationResult => {
    const trimmed = (telefono || '').trim().replace(/\D/g, '');
    if (!trimmed) {
      if (!requerido) return { isValid: true };
      return { isValid: false, message: 'El número de celular/WhatsApp es obligatorio.' };
    }
    if (!/^9\d{8}$/.test(trimmed)) {
      return { isValid: false, message: 'El número de celular debe tener 9 dígitos e iniciar con 9.' };
    }
    return { isValid: true };
  },

  /**
   * Valida un correo electrónico con formato estándar.
   */
  email: (email: string | undefined | null, requerido = true): ValidationResult => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      if (!requerido) return { isValid: true };
      return { isValid: false, message: 'El correo electrónico es obligatorio.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, message: 'El correo electrónico ingresado no tiene un formato válido (ej: contacto@negocio.pe).' };
    }
    return { isValid: true };
  },

  /**
   * Valida un nombre de usuario para inicio de sesión (min 3 caracteres, sin espacios, alfanumérico).
   */
  username: (username: string | undefined | null, minLength = 3): ValidationResult => {
    const trimmed = (username || '').trim();
    if (!trimmed) {
      return { isValid: false, message: 'El nombre de usuario es obligatorio.' };
    }
    if (trimmed.length < minLength) {
      return { isValid: false, message: `El usuario debe tener al menos ${minLength} caracteres.` };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      return { isValid: false, message: 'El usuario solo puede contener letras, números, guiones y puntos.' };
    }
    return { isValid: true };
  },

  /**
   * Valida una contraseña (mínimo de caracteres requeridos).
   */
  password: (password: string | undefined | null, minLength = 6): ValidationResult => {
    const val = password || '';
    if (!val) {
      return { isValid: false, message: 'La contraseña provisional es obligatoria.' };
    }
    if (val.length < minLength) {
      return { isValid: false, message: `La contraseña debe tener al menos ${minLength} caracteres.` };
    }
    return { isValid: true };
  },
};

/**
 * Validador helper que ejecuta una lista de comprobaciones y muestra un Toast descriptivo
 * ante el primer error encontrado. Retorna true si todo es válido, o false si falló.
 */
export const validateAndNotify = (validations: Array<() => ValidationResult>): boolean => {
  for (const validateFn of validations) {
    const result = validateFn();
    if (!result.isValid && result.message) {
      toast.error(result.message, {
        id: 'form-validation-toast',
        duration: 4000,
        icon: '⚠️',
      });
      return false;
    }
  }
  return true;
};
