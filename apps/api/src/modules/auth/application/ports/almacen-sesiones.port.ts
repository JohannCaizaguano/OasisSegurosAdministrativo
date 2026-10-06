export const ALMACEN_SESIONES = Symbol('AlmacenSesionesPort');

export type ResultadoRotacion = 'ROTADA' | 'EXPIRADA' | 'REUTILIZADA';

/**
 * Sesiones activas por familia de rotación (ADR-016): cada `sid` guarda su `jti` vigente con un TTL
 * de inactividad que se desliza con cada uso.
 */
export interface AlmacenSesionesPort {
  abrir(usuarioId: string, sid: string, jti: string): Promise<void>;
  /** Cambia el `jti` vigente; un `jti` que no es el vigente revoca la sesión (reutilización). */
  rotar(
    usuarioId: string,
    sid: string,
    jtiPresentado: string,
    jtiNuevo: string,
  ): Promise<ResultadoRotacion>;
  /** Extiende la inactividad; false si la sesión ya no existe. */
  tocar(usuarioId: string, sid: string): Promise<boolean>;
  cerrar(usuarioId: string, sid: string): Promise<void>;
  cerrarDemas(usuarioId: string, sidVigente: string): Promise<void>;
}
