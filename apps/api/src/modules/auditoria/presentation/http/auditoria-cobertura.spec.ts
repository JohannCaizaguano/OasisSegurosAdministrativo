import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';

import { AUDITAR_KEY } from '../../../../common/auditoria/auditar.decorator';
import { AseguradorasController } from '../../../aseguradoras/presentation/http/aseguradoras.controller';
import { AuthController } from '../../../auth/presentation/http/auth.controller';
import { ClientesController } from '../../../clientes/presentation/http/clientes.controller';
import {
  MisPagosController,
  PagosController,
} from '../../../pagos/presentation/http/pagos.controller';
import {
  MisPolizasController,
  PolizasController,
} from '../../../polizas/presentation/http/polizas.controller';
import { RecibosController } from '../../../recibos/presentation/http/recibos.controller';
import { VerificacionPublicaController } from '../../../recibos/presentation/http/verificacion-publica.controller';
import { UsuariosController } from '../../../usuarios/presentation/http/usuarios.controller';
import { BitacoraController } from './bitacora.controller';

const CONTROLADORES = [
  AuthController,
  ClientesController,
  AseguradorasController,
  PolizasController,
  MisPolizasController,
  PagosController,
  MisPagosController,
  RecibosController,
  VerificacionPublicaController,
  UsuariosController,
  BitacoraController,
];

/** Mutaciones que no cambian datos de negocio ni son acciones del catálogo. */
const EXENTOS = new Set(['AuthController.refrescarSesion', 'AuthController.cerrarSesion']);

const METODOS_MUTACION = [
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  RequestMethod.DELETE,
];

const ESPERADAS: Record<string, { accion: string; entidad: string }> = {
  'AuthController.iniciarSesion': { accion: 'INICIAR_SESION', entidad: 'Usuario' },
  'ClientesController.crear': { accion: 'CREAR', entidad: 'Cliente' },
  'ClientesController.actualizar': { accion: 'MODIFICAR', entidad: 'Cliente' },
  'ClientesController.eliminar': { accion: 'ELIMINAR', entidad: 'Cliente' },
  'AseguradorasController.crear': { accion: 'CREAR', entidad: 'Aseguradora' },
  'AseguradorasController.actualizar': { accion: 'MODIFICAR', entidad: 'Aseguradora' },
  'AseguradorasController.eliminar': { accion: 'ELIMINAR', entidad: 'Aseguradora' },
  'PolizasController.crear': { accion: 'CREAR', entidad: 'Poliza' },
  'PolizasController.actualizar': { accion: 'MODIFICAR', entidad: 'Poliza' },
  'PolizasController.eliminar': { accion: 'ELIMINAR', entidad: 'Poliza' },
  'PagosController.crear': { accion: 'CREAR', entidad: 'Pago' },
  'PagosController.validar': { accion: 'VALIDAR', entidad: 'Pago' },
  'PagosController.rechazar': { accion: 'RECHAZAR', entidad: 'Pago' },
  'RecibosController.reintentar': { accion: 'REINTENTAR', entidad: 'Recibo' },
  'RecibosController.anular': { accion: 'ANULAR', entidad: 'Recibo' },
};

function mutacionesInstrumentadas(): Record<string, unknown> {
  const encontradas: Record<string, unknown> = {};

  for (const controlador of CONTROLADORES) {
    for (const nombre of Object.getOwnPropertyNames(controlador.prototype)) {
      const handler = Object.getOwnPropertyDescriptor(controlador.prototype, nombre)?.value;
      if (typeof handler !== 'function') {
        continue;
      }

      const metodo = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
      if (metodo === undefined || !METODOS_MUTACION.includes(metodo)) {
        continue;
      }

      const clave = `${controlador.name}.${nombre}`;
      if (EXENTOS.has(clave)) {
        continue;
      }
      encontradas[clave] = Reflect.getMetadata(AUDITAR_KEY, handler);
    }
  }

  return encontradas;
}

describe('cobertura de @Auditar', () => {
  it('instrumenta todas las mutaciones HTTP con su acción y entidad', () => {
    expect(mutacionesInstrumentadas()).toEqual(ESPERADAS);
  });
});
