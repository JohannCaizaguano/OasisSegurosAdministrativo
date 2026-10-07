export const GENERADOR_CONTRASENA = Symbol('GeneradorContrasenaPort');

export interface GeneradorContrasenaPort {
  /** Contraseña temporal en claro; el caso de uso la hashea y la devuelve una sola vez. */
  generar(): string;
}
