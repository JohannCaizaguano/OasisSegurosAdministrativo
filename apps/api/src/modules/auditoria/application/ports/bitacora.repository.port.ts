import type { AccionAuditoria } from '@oasis/shared';

import type { NuevoRegistroAuditoria, RegistroAuditoria } from '../../domain/registro-auditoria';

export const BITACORA_REPOSITORY = Symbol('BitacoraRepositoryPort');

export interface FiltrosBitacora {
  usuarioId?: string;
  accion?: AccionAuditoria;
  desde?: Date;
  hastaExclusivo?: Date;
  pagina: number;
  porPagina: number;
}

export interface PaginaBitacora {
  items: RegistroAuditoria[];
  total: number;
}

export interface UsuarioBitacora {
  id: string;
  email: string;
}

/** Solo inserción y consulta: la bitácora no se modifica ni se elimina (RN-17). */
export interface BitacoraRepositoryPort {
  registrar(registro: NuevoRegistroAuditoria): Promise<void>;
  listar(filtros: FiltrosBitacora): Promise<PaginaBitacora>;
  /** Usuarios que aparecen en la bitácora (incluye CLIENTE), para el filtro de HU-45. */
  listarUsuarios(): Promise<UsuarioBitacora[]>;
}
