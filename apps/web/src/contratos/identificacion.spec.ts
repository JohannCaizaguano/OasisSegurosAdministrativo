import { describe, expect, it } from 'vitest';

import {
  normalizarIdentificacion,
  validarCedula,
  validarIdentificacion,
  validarPasaporte,
  validarRuc,
} from '@oasis/shared';

/**
 * RN-11 (ADR-017): las validaciones de identificación viven en el paquete
 * compartido y las consumen el API y la SPA.
 */

describe('validarCedula', () => {
  it('acepta una cédula válida', () => {
    expect(validarCedula('1710034065')).toBe(true);
  });

  it('rechaza una cédula con dígito verificador incorrecto', () => {
    expect(validarCedula('1712345678')).toBe(false);
  });

  it('rechaza la provincia 25 y acepta la 30', () => {
    expect(validarCedula('2510034065')).toBe(false);
    expect(validarCedula('3010034068')).toBe(true);
  });

  it('rechaza una cédula con tercer dígito 6', () => {
    expect(validarCedula('1760034064')).toBe(false);
  });
});

describe('validarRuc', () => {
  it('acepta el RUC de persona natural con cédula válida', () => {
    expect(validarRuc('1710034065001')).toBe(true);
  });

  it('rechaza el RUC de persona natural con cédula inválida', () => {
    expect(validarRuc('1712345678001')).toBe(false);
  });

  it('acepta RUC de sociedad privada y pública sin módulo 11', () => {
    expect(validarRuc('1790012345001')).toBe(true);
    expect(validarRuc('1760001550001')).toBe(true);
  });

  it('rechaza un RUC que no termina en 001', () => {
    expect(validarRuc('1790012345002')).toBe(false);
  });

  it('rechaza el tercer dígito 7 u 8 en RUC', () => {
    expect(validarRuc('1770012345001')).toBe(false);
    expect(validarRuc('1780012345001')).toBe(false);
  });
});

describe('validarPasaporte y normalizarIdentificacion', () => {
  it('normaliza el pasaporte a mayúsculas', () => {
    expect(normalizarIdentificacion('PASAPORTE', ' ab123 ')).toBe('AB123');
    expect(validarPasaporte('ab123')).toBe(true);
  });

  it('rechaza un pasaporte con símbolos o de menos de 5 caracteres', () => {
    expect(validarPasaporte('ab!23')).toBe(false);
    expect(validarPasaporte('abc1')).toBe(false);
  });
});

describe('validarIdentificacion', () => {
  it('devuelve null si es válida y el mensaje del primer fallo si no', () => {
    expect(validarIdentificacion('CEDULA', '1710034065')).toBeNull();
    expect(validarIdentificacion('CEDULA', '1712345678')).toBe(
      'Dígito verificador de la cédula inválido',
    );
    expect(validarIdentificacion('RUC', '1790012345002')).toBe(
      'El RUC debe tener 13 dígitos y terminar en 001',
    );
    expect(validarIdentificacion('PASAPORTE', 'abc1')).toBe(
      'El pasaporte debe tener de 5 a 20 letras o números',
    );
  });
});
