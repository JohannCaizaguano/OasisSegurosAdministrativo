export const ALMACEN_REFRESH = Symbol('AlmacenRefreshPort');

/**
 * Persistencia efímera de refresh tokens (Redis) con rotación:
 * sólo el jti vigente de cada usuario es válido; consumirlo lo invalida.
 */
export interface AlmacenRefreshPort {
  guardar(usuarioId: string, jti: string): Promise<void>;
  consumir(usuarioId: string, jti: string): Promise<boolean>;
  revocar(usuarioId: string, jti: string): Promise<void>;
  revocarTodos(usuarioId: string): Promise<void>;
}
