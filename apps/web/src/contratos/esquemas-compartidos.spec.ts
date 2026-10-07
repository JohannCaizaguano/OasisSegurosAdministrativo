import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  actualizarUsuarioSchema,
  apiErrorSchema,
  cambiarContrasenaSchema,
  crearAseguradoraSchema,
  crearClienteSchema,
  crearPagoSchema,
  crearUsuarioSchema,
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
      identificacion: '1710034065',
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
        identificacion: '1710034065',
        email: 'correo-invalido',
        nombres: 'Ana',
        apellidos: 'Pérez',
      }).success,
    ).toBe(false);
  });
});

describe('RN-11 en el registro de cliente', () => {
  it('rechaza una cédula inválida con el mensaje en identificacion', () => {
    const resultado = crearClienteSchema.safeParse({
      tipoIdentificacion: 'CEDULA',
      identificacion: '1712345678',
      email: 'a@b.com',
      nombres: 'Ana',
      apellidos: 'Pérez',
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const issue = resultado.error.issues.find((item) => item.path[0] === 'identificacion');
      expect(issue?.message).toBe('Dígito verificador de la cédula inválido');
    }
  });

  it('normaliza el pasaporte del cliente', () => {
    const resultado = crearClienteSchema.safeParse({
      tipoIdentificacion: 'PASAPORTE',
      identificacion: ' ab123 ',
      email: 'a@b.com',
      nombres: 'Ana',
      apellidos: 'Pérez',
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.identificacion).toBe('AB123');
    }
  });

  it('acepta un pasaporte de 20 caracteres con espacios alrededor', () => {
    const resultado = crearClienteSchema.safeParse({
      tipoIdentificacion: 'PASAPORTE',
      identificacion: `  ${'a'.repeat(20)}  `,
      email: 'a@b.com',
      nombres: 'Ana',
      apellidos: 'Pérez',
    });
    expect(resultado.success).toBe(true);
  });
});

describe('esquemas de usuario del personal', () => {
  it('rechaza crear un usuario con rol CLIENTE', () => {
    const base = { email: 'nuevo@oasis.com', nombre: 'Nuevo Usuario' };
    expect(crearUsuarioSchema.safeParse({ ...base, rol: 'OPERADOR' }).success).toBe(true);
    expect(crearUsuarioSchema.safeParse({ ...base, rol: 'CLIENTE' }).success).toBe(false);
  });

  it('rechaza editar el correo de un usuario', () => {
    expect(actualizarUsuarioSchema.safeParse({ nombre: 'Otro Nombre' }).success).toBe(true);
    expect(
      actualizarUsuarioSchema.safeParse({ nombre: 'Otro', email: 'otro@oasis.com' }).success,
    ).toBe(false);
  });
});

describe('RN-11 en aseguradoras', () => {
  it('rechaza una aseguradora con RUC de tercer dígito 7', () => {
    expect(
      crearAseguradoraSchema.safeParse({ nombre: 'Aseguradora X', ruc: '1770012345001' }).success,
    ).toBe(false);
    expect(
      crearAseguradoraSchema.safeParse({ nombre: 'Aseguradora X', ruc: '1790012345001' }).success,
    ).toBe(true);
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

describe('cambiarContrasenaSchema', () => {
  const valido = { actual: 'Secreta.123', nueva: 'Nueva.Clave1' };

  it('rechaza una nueva de 7 caracteres, una de 129 y una igual a la actual', () => {
    expect(cambiarContrasenaSchema.safeParse({ ...valido, nueva: '1234567' }).success).toBe(false);
    expect(cambiarContrasenaSchema.safeParse({ ...valido, nueva: 'x'.repeat(129) }).success).toBe(
      false,
    );
    expect(cambiarContrasenaSchema.safeParse({ ...valido, nueva: valido.actual }).success).toBe(
      false,
    );
  });

  it('rechaza una contraseña actual vacía', () => {
    expect(cambiarContrasenaSchema.safeParse({ ...valido, actual: '' }).success).toBe(false);
  });

  it('acepta un cambio válido', () => {
    expect(cambiarContrasenaSchema.safeParse(valido).success).toBe(true);
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
