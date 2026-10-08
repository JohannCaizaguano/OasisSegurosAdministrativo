import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ACCIONES_AUDITORIA,
  actualizarPolizaSchema,
  actualizarUsuarioSchema,
  apiErrorSchema,
  cambiarContrasenaSchema,
  cambiarEstadoPolizaSchema,
  clienteSchema,
  crearAseguradoraSchema,
  crearClienteSchema,
  crearPagoSchema,
  crearPolizaSchema,
  crearUsuarioSchema,
  listarClientesQuerySchema,
  listarPolizasQuerySchema,
  loginSchema,
  montoDecimalSchema,
  montoPositivoSchema,
  polizaSchema,
  ramoSchema,
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
const CLIENTE_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ASEGURADORA_ID = 'd3b07384-d9a0-4c9b-a63c-1b0e1b1e0e11';
const RAMO_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

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

describe('filtro de estado de clientes (HU-09)', () => {
  it('por defecto lista solo los activos', () => {
    const resultado = listarClientesQuerySchema.safeParse({});
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.estado).toBe('ACTIVOS');
    }
  });

  it('acepta los tres filtros y rechaza uno desconocido', () => {
    expect(listarClientesQuerySchema.safeParse({ estado: 'TODOS' }).success).toBe(true);
    expect(listarClientesQuerySchema.safeParse({ estado: 'INACTIVOS' }).success).toBe(true);
    expect(listarClientesQuerySchema.safeParse({ estado: 'BAJAS' }).success).toBe(false);
  });
});

describe('respuesta de cliente (D7)', () => {
  const respuesta = {
    id: CLIENTE_ID,
    tipoIdentificacion: 'CEDULA',
    identificacion: '1710034065',
    nombres: 'Ana',
    apellidos: 'Pérez',
    email: 'ana@example.com',
    activo: true,
    tienePolizas: false,
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-05T12:00:00.000Z',
  };

  it('acepta activo y tienePolizas', () => {
    expect(clienteSchema.safeParse(respuesta).success).toBe(true);
  });

  it('los exige: el API siempre calcula ambos', () => {
    expect(clienteSchema.safeParse({ ...respuesta, activo: undefined }).success).toBe(false);
    expect(clienteSchema.safeParse({ ...respuesta, tienePolizas: undefined }).success).toBe(false);
  });
});

describe('montoPositivoSchema (RN-10)', () => {
  it('exige una prima mayor que cero con hasta dos decimales', () => {
    expect(montoPositivoSchema.safeParse('0').success).toBe(false);
    expect(montoPositivoSchema.safeParse('0.00').success).toBe(false);
    expect(montoPositivoSchema.safeParse('-1').success).toBe(false);
    expect(montoPositivoSchema.safeParse('1.234').success).toBe(false);
    expect(montoPositivoSchema.safeParse('0.01').success).toBe(true);
    expect(montoPositivoSchema.safeParse('1500.5').success).toBe(true);
  });
});

describe('crearPolizaSchema (HU-12)', () => {
  const valida = {
    numero: 'POL-2026-001',
    clienteId: CLIENTE_ID,
    aseguradoraId: ASEGURADORA_ID,
    ramoId: RAMO_ID,
    primaTotal: '1500.50',
    fechaInicio: '2026-10-05',
    fechaFin: '2027-10-04',
  };

  it('acepta una póliza válida con ramoId del catálogo', () => {
    expect(crearPolizaSchema.safeParse(valida).success).toBe(true);
  });

  it('rechaza un ramo que no sea uuid', () => {
    expect(crearPolizaSchema.safeParse({ ...valida, ramoId: 'Vehículos' }).success).toBe(false);
  });

  it('exige que la fecha de fin sea estrictamente posterior a la de inicio', () => {
    const iguales = crearPolizaSchema.safeParse({ ...valida, fechaFin: valida.fechaInicio });
    expect(iguales.success).toBe(false);
    if (!iguales.success) {
      const issue = iguales.error.issues.find((item) => item.path[0] === 'fechaFin');
      expect(issue?.message).toBe('La fecha de fin debe ser posterior a la de inicio');
    }
    expect(crearPolizaSchema.safeParse({ ...valida, fechaFin: '2026-10-04' }).success).toBe(false);
  });

  it('descarta el estado entrante: el caso de uso crea la póliza VIGENTE', () => {
    const resultado = crearPolizaSchema.safeParse({ ...valida, estado: 'VENCIDA' });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).not.toHaveProperty('estado');
    }
  });
});

describe('actualizarPolizaSchema (D11)', () => {
  it('exige al menos un campo y acepta uno solo', () => {
    expect(actualizarPolizaSchema.safeParse({}).success).toBe(false);
    expect(actualizarPolizaSchema.safeParse({ numero: 'POL-2026-002' }).success).toBe(true);
  });

  it('rechaza clienteId y estado: la póliza no cambia de cliente ni salta estados', () => {
    expect(actualizarPolizaSchema.safeParse({ clienteId: CLIENTE_ID }).success).toBe(false);
    expect(actualizarPolizaSchema.safeParse({ estado: 'CANCELADA' }).success).toBe(false);
  });

  it('valida las fechas cuando llegan ambas, incluso iguales', () => {
    expect(
      actualizarPolizaSchema.safeParse({
        fechaInicio: '2026-10-05',
        fechaFin: '2026-10-05',
      }).success,
    ).toBe(false);
    expect(
      actualizarPolizaSchema.safeParse({
        fechaInicio: '2026-10-05',
        fechaFin: '2027-10-04',
      }).success,
    ).toBe(true);
  });
});

describe('cambiarEstadoPolizaSchema (D12)', () => {
  it('solo acepta VENCIDA o CANCELADA como destino', () => {
    expect(cambiarEstadoPolizaSchema.safeParse({ estado: 'VENCIDA' }).success).toBe(true);
    expect(cambiarEstadoPolizaSchema.safeParse({ estado: 'CANCELADA' }).success).toBe(true);
    expect(cambiarEstadoPolizaSchema.safeParse({ estado: 'VIGENTE' }).success).toBe(false);
  });
});

describe('polizaSchema de respuesta', () => {
  const respuesta = {
    id: POLIZA_ID,
    numero: 'POL-2026-001',
    clienteId: CLIENTE_ID,
    aseguradoraId: ASEGURADORA_ID,
    ramoId: RAMO_ID,
    ramo: 'Vehículos',
    primaTotal: '480.50',
    fechaInicio: '2026-10-05',
    fechaFin: '2027-10-04',
    estado: 'VIGENTE',
    clienteNombre: 'Ana Pérez',
    aseguradoraNombre: 'Aseguradora X',
    tienePagosValidados: false,
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-05T12:00:00.000Z',
  };

  it('incluye ramoId, ramo y tienePagosValidados', () => {
    expect(polizaSchema.safeParse(respuesta).success).toBe(true);
    expect(polizaSchema.safeParse({ ...respuesta, tienePagosValidados: undefined }).success).toBe(
      false,
    );
  });

  it('exige clienteId y ramo: la SPA los pinta sin consultas extra', () => {
    expect(polizaSchema.safeParse({ ...respuesta, clienteId: undefined }).success).toBe(false);
    expect(polizaSchema.safeParse({ ...respuesta, ramo: undefined }).success).toBe(false);
  });
});

describe('listarPolizasQuerySchema (HU-14)', () => {
  it('filtra por aseguradora y ordena por recientes por defecto', () => {
    const resultado = listarPolizasQuerySchema.safeParse({ aseguradoraId: ASEGURADORA_ID });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.orden).toBe('recientes');
      expect(resultado.data.aseguradoraId).toBe(ASEGURADORA_ID);
    }
  });

  it('acepta los tres órdenes y rechaza uno desconocido', () => {
    expect(listarPolizasQuerySchema.safeParse({ orden: 'fechaFinAsc' }).success).toBe(true);
    expect(listarPolizasQuerySchema.safeParse({ orden: 'fechaFinDesc' }).success).toBe(true);
    expect(listarPolizasQuerySchema.safeParse({ orden: 'antiguas' }).success).toBe(false);
  });
});

describe('ramoSchema', () => {
  it('valida el ramo del catálogo', () => {
    expect(
      ramoSchema.safeParse({ id: RAMO_ID, codigo: 'VEHICULOS', nombre: 'Vehículos' }).success,
    ).toBe(true);
    expect(
      ramoSchema.safeParse({ id: 'no-es-uuid', codigo: 'VEHICULOS', nombre: 'Vehículos' }).success,
    ).toBe(false);
  });
});

describe('acciones de auditoría', () => {
  it('incluye CAMBIAR_ESTADO (D12)', () => {
    expect(ACCIONES_AUDITORIA).toContain('CAMBIAR_ESTADO');
  });
});
