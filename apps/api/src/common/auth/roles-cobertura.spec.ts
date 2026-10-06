import { rutasDeclaradas } from '../../../test/rutas-declaradas';

/** Únicas rutas sin JWT (ADR-015). La recuperación de contraseña se sumará con HU-31. */
const PUBLICAS = [
  'AuthController.cerrarSesion',
  'AuthController.iniciarSesion',
  'AuthController.refrescarSesion',
  'HealthController.check',
  'MetricsController.obtener',
];

describe('cobertura de @Roles', () => {
  it('solo las rutas de ADR-015 son públicas', () => {
    const publicas = rutasDeclaradas()
      .filter((ruta) => ruta.esPublica)
      .map((ruta) => ruta.clave)
      .sort();
    expect(publicas).toEqual(PUBLICAS);
  });

  it('toda ruta no pública declara al menos un rol', () => {
    const sinRoles = rutasDeclaradas().filter((ruta) => !ruta.esPublica && ruta.roles.length === 0);
    expect(sinRoles.map((ruta) => ruta.clave)).toEqual([]);
  });
});
