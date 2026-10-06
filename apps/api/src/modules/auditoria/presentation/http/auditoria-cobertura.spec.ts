import { RequestMethod } from '@nestjs/common';

import { AUDITAR_KEY } from '../../../../common/auditoria/auditar.decorator';
import { rutasDeclaradas } from '../../../../../test/rutas-declaradas';

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
  'AuthController.cambiarContrasena': { accion: 'MODIFICAR', entidad: 'Usuario' },
  'UsuariosController.crear': { accion: 'CREAR', entidad: 'Usuario' },
  'UsuariosController.editar': { accion: 'MODIFICAR', entidad: 'Usuario' },
  'UsuariosController.desactivar': { accion: 'DESACTIVAR', entidad: 'Usuario' },
  'UsuariosController.reactivar': { accion: 'REACTIVAR', entidad: 'Usuario' },
  'UsuariosController.restablecer': { accion: 'RESTABLECER_CONTRASENA', entidad: 'Usuario' },
  'ClientesController.crear': { accion: 'CREAR', entidad: 'Cliente' },
  'ClientesController.actualizar': { accion: 'MODIFICAR', entidad: 'Cliente' },
  'AseguradorasController.crear': { accion: 'CREAR', entidad: 'Aseguradora' },
  'AseguradorasController.actualizar': { accion: 'MODIFICAR', entidad: 'Aseguradora' },
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

  for (const ruta of rutasDeclaradas()) {
    if (!METODOS_MUTACION.includes(ruta.metodo) || EXENTOS.has(ruta.clave)) {
      continue;
    }
    encontradas[ruta.clave] = Reflect.getMetadata(AUDITAR_KEY, ruta.handler);
  }

  return encontradas;
}

describe('cobertura de @Auditar', () => {
  it('instrumenta todas las mutaciones HTTP con su acción y entidad', () => {
    expect(mutacionesInstrumentadas()).toEqual(ESPERADAS);
  });
});
