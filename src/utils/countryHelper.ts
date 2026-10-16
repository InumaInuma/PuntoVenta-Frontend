/**
 * Utilidades para detección y formateo de país, moneda y prefijo telefónico (SaaS Internacional)
 */

export interface CountryDetails {
  iso: string;
  phoneCode: string;
  flag: string;
  phoneLength: number;
  placeholder: string;
  countryName: string;
  currencySymbol: string;
  currencyCode: string;
}

export const getCountryDetails = (
  codigoIso?: string,
  codigoTelefonico?: string,
  monedaSimbolo?: string,
  monedaCodigo?: string,
  paisNombre?: string
): CountryDetails => {
  const iso = (codigoIso || 'PE').toUpperCase().trim();

  let flag = '🌍';
  let phoneCode = (codigoTelefonico || '').replace(/\D/g, '');
  let phoneLength = 9;
  let placeholder = '987 654 321';
  let countryName = paisNombre || 'Perú';
  let currencySymbol = monedaSimbolo || 'S/';
  let currencyCode = monedaCodigo || 'PEN';

  switch (iso) {
    case 'PE':
      flag = '🇵🇪';
      phoneCode = phoneCode || '51';
      phoneLength = 9;
      placeholder = '987 654 321';
      countryName = paisNombre || 'Perú';
      currencySymbol = monedaSimbolo || 'S/';
      currencyCode = monedaCodigo || 'PEN';
      break;
    case 'BO':
      flag = '🇧🇴';
      phoneCode = phoneCode || '591';
      phoneLength = 8;
      placeholder = '7123 4567';
      countryName = paisNombre || 'Bolivia';
      currencySymbol = monedaSimbolo || 'Bs';
      currencyCode = monedaCodigo || 'BOB';
      break;
    case 'CO':
      flag = '🇨🇴';
      phoneCode = phoneCode || '57';
      phoneLength = 10;
      placeholder = '300 123 4567';
      countryName = paisNombre || 'Colombia';
      currencySymbol = monedaSimbolo || '$';
      currencyCode = monedaCodigo || 'COP';
      break;
    case 'CL':
      flag = '🇨🇱';
      phoneCode = phoneCode || '56';
      phoneLength = 9;
      placeholder = '9 1234 5678';
      countryName = paisNombre || 'Chile';
      currencySymbol = monedaSimbolo || '$';
      currencyCode = monedaCodigo || 'CLP';
      break;
    case 'MX':
      flag = '🇲🇽';
      phoneCode = phoneCode || '52';
      phoneLength = 10;
      placeholder = '55 1234 5678';
      countryName = paisNombre || 'México';
      currencySymbol = monedaSimbolo || '$';
      currencyCode = monedaCodigo || 'MXN';
      break;
    case 'EC':
      flag = '🇪🇨';
      phoneCode = phoneCode || '593';
      phoneLength = 9;
      placeholder = '99 123 4567';
      countryName = paisNombre || 'Ecuador';
      currencySymbol = monedaSimbolo || '$';
      currencyCode = monedaCodigo || 'USD';
      break;
    case 'AR':
      flag = '🇦🇷';
      phoneCode = phoneCode || '54';
      phoneLength = 10;
      placeholder = '11 1234 5678';
      countryName = paisNombre || 'Argentina';
      currencySymbol = monedaSimbolo || '$';
      currencyCode = monedaCodigo || 'ARS';
      break;
    case 'ES':
      flag = '🇪🇸';
      phoneCode = phoneCode || '34';
      phoneLength = 9;
      placeholder = '612 34 56 78';
      countryName = paisNombre || 'España';
      currencySymbol = monedaSimbolo || '€';
      currencyCode = monedaCodigo || 'EUR';
      break;
    default:
      phoneCode = phoneCode || '51';
      phoneLength = 9;
      placeholder = '987 654 321';
      break;
  }

  return {
    iso,
    phoneCode,
    flag,
    phoneLength,
    placeholder,
    countryName,
    currencySymbol,
    currencyCode,
  };
};

export const getCachedTenantCountry = (): CountryDetails => {
  const iso = localStorage.getItem('almain_tenant_country_iso') || 'PE';
  const phoneCode = localStorage.getItem('almain_tenant_country_phone') || '51';
  const currencySymbol = localStorage.getItem('almain_tenant_currency_symbol') || 'S/';
  const currencyCode = localStorage.getItem('almain_tenant_currency_code') || 'PEN';
  const countryName = localStorage.getItem('almain_tenant_country_name') || 'Perú';
  return getCountryDetails(iso, phoneCode, currencySymbol, currencyCode, countryName);
};

export const saveCachedTenantCountry = (config: {
  codigoIso?: string;
  codigoTelefonico?: string;
  monedaSimbolo?: string;
  monedaCodigo?: string;
  paisNombre?: string;
}) => {
  if (config.codigoIso) localStorage.setItem('almain_tenant_country_iso', config.codigoIso);
  if (config.codigoTelefonico) localStorage.setItem('almain_tenant_country_phone', config.codigoTelefonico);
  if (config.monedaSimbolo) localStorage.setItem('almain_tenant_currency_symbol', config.monedaSimbolo);
  if (config.monedaCodigo) localStorage.setItem('almain_tenant_currency_code', config.monedaCodigo);
  if (config.paisNombre) localStorage.setItem('almain_tenant_country_name', config.paisNombre);
};
