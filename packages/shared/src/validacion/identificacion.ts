import type { TipoIdentificacion } from '../constants/estados';

const PROVINCIA_VALIDA = /^(0[1-9]|1\d|2[0-4]|30)$/;

function provinciaValida(identificacion: string): boolean {
  return PROVINCIA_VALIDA.test(identificacion.slice(0, 2));
}

function digitoVerificadorCedula(cedula: string): number {
  const suma = [...cedula.slice(0, 9)].reduce((acc, digito, indice) => {
    const producto = Number(digito) * (indice % 2 === 0 ? 2 : 1);
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);
  return (10 - (suma % 10)) % 10;
}

export function normalizarIdentificacion(tipo: TipoIdentificacion, valor: string): string {
  const limpio = valor.trim();
  return tipo === 'PASAPORTE' ? limpio.toUpperCase() : limpio;
}

export function validarIdentificacion(tipo: TipoIdentificacion, valor: string): string | null {
  const texto = normalizarIdentificacion(tipo, valor);
  switch (tipo) {
    case 'CEDULA': {
      if (!/^\d{10}$/.test(texto)) {
        return 'La cédula debe tener 10 dígitos';
      }
      if (!provinciaValida(texto)) {
        return 'Código de provincia inválido';
      }
      if (Number(texto[2]) >= 6) {
        return 'El tercer dígito de la cédula debe ser menor que 6';
      }
      if (digitoVerificadorCedula(texto) !== Number(texto[9])) {
        return 'Dígito verificador de la cédula inválido';
      }
      return null;
    }
    case 'RUC': {
      if (!/^\d{13}$/.test(texto) || !texto.endsWith('001')) {
        return 'El RUC debe tener 13 dígitos y terminar en 001';
      }
      if (!provinciaValida(texto)) {
        return 'Código de provincia inválido';
      }
      const tercerDigito = Number(texto[2]);
      if (tercerDigito <= 5) {
        return validarIdentificacion('CEDULA', texto.slice(0, 10)) === null
          ? null
          : 'El RUC de persona natural debe contener una cédula válida';
      }
      // ponytail: sin módulo 11: el SRI emite RUC de sociedades que no lo cumplen; si RN-11 lo exige, agregarlo aquí.
      return tercerDigito === 6 || tercerDigito === 9
        ? null
        : 'El tercer dígito del RUC no es válido';
    }
    case 'PASAPORTE':
      return /^[A-Z0-9]{5,20}$/.test(texto)
        ? null
        : 'El pasaporte debe tener de 5 a 20 letras o números';
  }
}

export function validarCedula(valor: string): boolean {
  return validarIdentificacion('CEDULA', valor) === null;
}

export function validarRuc(valor: string): boolean {
  return validarIdentificacion('RUC', valor) === null;
}

export function validarPasaporte(valor: string): boolean {
  return validarIdentificacion('PASAPORTE', valor) === null;
}
