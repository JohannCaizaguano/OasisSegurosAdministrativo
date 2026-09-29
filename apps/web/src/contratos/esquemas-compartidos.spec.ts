import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  apiErrorSchema,
  crearClienteSchema,
  crearPagoSchema,
  loginSchema,
  montoDecimalSchema,
  rechazarPagoSchema,
  respuestaPaginadaSchema,
  validarPagoSchema,
} from '@oasis/shared';

/**
 * Los esquemas compartidos son el contrato entre API y SPA; estos tests viven
 * en la SPA, el paquete del workspace con runner de tests.
 */

// UUID v4 válido: `z.uuid()` exige la variante RFC 4122 (versión 1-8, variante 8/9/a/b).
const POLIZA_ID = '3f2a1c8e-4b5d-4e6f-8a9b-0c1d2e3f4a5b';

describe('respuestaPaginadaSchema', () => {
  it('exige los elementos y los metadatos de paginación', () => {
    const esquema = respuestaPaginadaSchema(z.object({ id: z.string() }));
    expect(
      esquema.safeParse({
        data: [{ id: 'a' }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
    expect(esquema.safeParse({ data: [{ id: 'a' }], meta: { page: 0 } }).success).toBe(false);
  });
});

describe('montos decimales', () => {
  it('acepta hasta 10 enteros y 2 decimales', () => {
    expect(montoDecimalSchema.safeParse('0.01').success).toBe(true);
    expect(montoDecimalSchema.safeParse('1234567890.99').success).toBe(true);
    expect(montoDecimalSchema.safeParse('25').success).toBe(true);
  });

  it('rechaza floats, negativos, comas y más de 2 decimales', () => {
    // El importe viaja como string: un float perdería precisión en el JSON.
    expect(montoDecimalSchema.safeParse(25.5).success).toBe(false);
    expect(montoDecimalSchema.safeParse('-5.00').success).toBe(false);
    expect(montoDecimalSchema.safeParse('25,50').success).toBe(false);
    expect(montoDecimalSchema.safeParse('25.555').success).toBe(false);
    expect(montoDecimalSchema.safeParse('12345678901.00').success).toBe(false);
  });
});

describe('crearPagoSchema', () => {
  const valido = {
    polizaId: POLIZA_ID,
    monto: '120.50',
    fechaPago: '2026-09-01',
    metodo: 'TRANSFERENCIA',
  };

  it('acepta un pago válido', () => {
    expect(crearPagoSchema.safeParse(valido).success).toBe(true);
  });

  it('exige polizaId como uuid y fechaPago como fecha ISO', () => {
    expect(crearPagoSchema.safeParse({ ...valido, polizaId: 'no-es-uuid' }).success).toBe(false);
    expect(crearPagoSchema.safeParse({ ...valido, fechaPago: '01/09/2026' }).success).toBe(false);
  });

  it('rechaza métodos de pago fuera del catálogo', () => {
    expect(crearPagoSchema.safeParse({ ...valido, metodo: 'CRIPTOMONEDA' }).success).toBe(false);
  });
});

describe('confirmación de validar y rechazar un pago', () => {
  it('exige confirmación explícita para validar', () => {
    expect(validarPagoSchema.safeParse({}).success).toBe(false);
    expect(validarPagoSchema.safeParse({ confirmado: false }).success).toBe(false);
    expect(validarPagoSchema.safeParse({ confirmado: true }).success).toBe(true);
  });

  it('acepta una nota de auditoría opcional pero acotada', () => {
    expect(validarPagoSchema.safeParse({ confirmado: true, nota: 'depósito ok' }).success).toBe(
      true,
    );
    expect(validarPagoSchema.safeParse({ confirmado: true, nota: 'x'.repeat(301) }).success).toBe(
      false,
    );
  });

  it('exige un motivo de 5 a 300 caracteres al rechazar', () => {
    expect(rechazarPagoSchema.safeParse({ confirmado: true }).success).toBe(false);
    expect(rechazarPagoSchema.safeParse({ confirmado: true, motivo: 'abc' }).success).toBe(false);
    expect(
      rechazarPagoSchema.safeParse({ confirmado: true, motivo: 'no se encontró' }).success,
    ).toBe(true);
    expect(
      rechazarPagoSchema.safeParse({ confirmado: true, motivo: 'x'.repeat(301) }).success,
    ).toBe(false);
  });
});

describe('crearClienteSchema', () => {
  it('exige razón social para RUC y nombres y apellidos para cédula', () => {
    const ruc = { tipoIdentificacion: 'RUC', identificacion: '1790844521001', email: 'a@b.com' };
    expect(crearClienteSchema.safeParse(ruc).success).toBe(false);
    expect(crearClienteSchema.safeParse({ ...ruc, razonSocial: 'Oasis Seguros' }).success).toBe(
      true,
    );

    const cedula = {
      tipoIdentificacion: 'CEDULA',
      identificacion: '1712345678',
      email: 'a@b.com',
    };
    expect(crearClienteSchema.safeParse(cedula).success).toBe(false);
    expect(
      crearClienteSchema.safeParse({ ...cedula, nombres: 'Ana', apellidos: 'Pérez' }).success,
    ).toBe(true);
  });

  it('valida el formato del correo', () => {
    expect(
      crearClienteSchema.safeParse({
        tipoIdentificacion: 'CEDULA',
        identificacion: '1712345678',
        email: 'correo-invalido',
        nombres: 'Ana',
        apellidos: 'Pérez',
      }).success,
    ).toBe(false);
  });
});

describe('loginSchema', () => {
  it('exige correo y contraseña no vacíos', () => {
    // La contraseña exige 8 caracteres como mínimo.
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secreto1' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'nope', password: 'secreto1' }).success).toBe(false);
  });
});

describe('apiErrorSchema (contrato de error compartido)', () => {
  it('valida el cuerpo que produce el filtro global de errores del API', () => {
    const cuerpo = {
      statusCode: 422,
      code: 'REGLA_NEGOCIO',
      message: 'El pago ya está validado',
      requestId: '0f0c1f3e-1111-2222-3333-444455556666',
      timestamp: '2026-09-28T12:00:00.000Z',
      path: '/api/v1/pagos/1/validar',
    };
    const resultado = apiErrorSchema.safeParse(cuerpo);
    expect(resultado.success).toBe(true);
  });

  it('exige requestId, timestamp y path', () => {
    expect(apiErrorSchema.safeParse({ statusCode: 500, code: 'X', message: 'y' }).success).toBe(
      false,
    );
  });
});
